import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const targets = [
  {
    path: "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_account.rs",
    database: "Sqlite",
    methods: [
      "upsert_provider_account",
      "upsert_provider_application",
      "upsert_provider_credential",
    ],
  },
  {
    path: "crates/sdkwork-communication-rtc-repository-sqlx/src/provider_account.rs",
    database: "Postgres",
    methods: [
      "upsert_provider_account",
      "upsert_provider_application",
      "upsert_provider_credential",
    ],
    implMarker: "impl RtcPostgresProviderAccountRepository",
  },
  {
    path: "crates/sdkwork-communication-rtc-repository-sqlx/src/media_session.rs",
    database: "Sqlite",
    methods: [
      "upsert_room",
      "upsert_media_session",
      "upsert_media_participant",
      "upsert_media_track",
      "upsert_media_artifact",
      "insert_quality_sample",
    ],
  },
  {
    path: "crates/sdkwork-communication-rtc-repository-sqlx/src/media_session.rs",
    database: "Postgres",
    methods: [
      "upsert_room",
      "upsert_media_session",
      "upsert_media_participant",
      "upsert_media_track",
      "upsert_media_artifact",
      "insert_quality_sample",
    ],
    implMarker: "impl RtcPostgresMediaSessionRepository",
  },
];

function ensureExecutorImport(source, database) {
  if (source.includes("use sqlx::{Executor")) {
    return source;
  }
  const importNeedle =
    database === "Sqlite"
      ? "use sqlx::{PgPool, Row, SqlitePool, postgres::PgRow, sqlite::SqliteRow};"
      : "use sqlx::{PgPool, Row, SqlitePool, postgres::PgRow, sqlite::SqliteRow};";
  const replacement =
    database === "Sqlite"
      ? "use sqlx::{Executor, PgPool, Row, Sqlite, SqlitePool, postgres::PgRow, sqlite::SqliteRow};"
      : "use sqlx::{Executor, PgPool, Postgres, Row, SqlitePool, postgres::PgRow, sqlite::SqliteRow};";
  return source.replace(importNeedle, replacement);
}

function transformMethodBlock(source, methodName, database) {
  const withName = `${methodName}_with`;
  if (source.includes(`pub async fn ${withName}`)) {
    return source;
  }

  const signature = new RegExp(
    `pub async fn ${methodName}\\(([\\s\\S]*?)\\) -> RtcStorageResult<\\(\\)> \\{([\\s\\S]*?)\\n    \\}`,
    "m",
  );
  const match = source.match(signature);
  if (!match) {
    throw new Error(`Could not find method ${methodName}`);
  }

  const params = match[1].trim();
  const body = match[2];
  if (!body.includes(".execute(&self.pool)")) {
    throw new Error(`${methodName} does not execute on pool`);
  }

  const executorBody = body.replace(".execute(&self.pool)", ".execute(executor)");
  const paramLines = params
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const executorParams = ["executor: E", ...paramLines.slice(1)].join("\n        ");

  const replacement = `pub async fn ${methodName}(
        ${params}
    ) -> RtcStorageResult<()> {
        self.${withName}(&self.pool, ${paramLines
    .slice(1)
    .map((line) => line.replace(/,$/, "").split(":")[0].trim())
    .join(", ")})
            .await
    }

    pub async fn ${withName}<'e, E>(
        &self,
        ${executorParams}
    ) -> RtcStorageResult<()>
    where
        E: Executor<'e, Database = ${database}>,
    {${executorBody}
    }`;

  return source.replace(signature, replacement);
}

function transformFile(target) {
  const filePath = resolve(root, target.path);
  let source = readFileSync(filePath, "utf8");
  if (target.implMarker) {
    const start = source.indexOf(target.implMarker);
    if (start < 0) {
      throw new Error(`Missing impl marker ${target.implMarker}`);
    }
    const head = source.slice(0, start);
    let tail = source.slice(start);
    tail = ensureExecutorImport(tail, target.database);
    for (const method of target.methods) {
      tail = transformMethodBlock(tail, method, target.database);
    }
    source = head + tail;
  } else {
    const postgresStart = source.indexOf("impl RtcPostgresProviderAccountRepository");
    const mediaPostgresStart = source.indexOf("impl RtcPostgresMediaSessionRepository");
    const splitAt =
      target.path.endsWith("provider_account.rs") && !target.implMarker
        ? postgresStart
        : target.path.endsWith("media_session.rs") && !target.implMarker
          ? mediaPostgresStart
          : -1;
    let head = "";
    let section = source;
    if (splitAt >= 0) {
      head = source.slice(0, splitAt);
      section = source.slice(0, splitAt);
    }
    section = ensureExecutorImport(section, target.database);
    for (const method of target.methods) {
      section = transformMethodBlock(section, method, target.database);
    }
    source = splitAt >= 0 ? section + source.slice(splitAt) : section;
  }
  writeFileSync(filePath, source);
}

for (const target of targets) {
  transformFile(target);
  process.stdout.write(`updated ${target.path} (${target.database})\n`);
}
