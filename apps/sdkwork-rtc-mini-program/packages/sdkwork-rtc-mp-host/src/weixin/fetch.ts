/// <reference types="miniprogram-api-typings" />

type FetchHeaders = Record<string, string>;

interface WxFetchInit {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  signal?: AbortSignal | null;
}

interface WxFetchResponse {
  ok: boolean;
  status: number;
  headers: {
    get(name: string): string | null;
  };
  json(): Promise<unknown>;
  text(): Promise<string>;
}

function normalizeHeaders(headers?: HeadersInit): FetchHeaders {
  if (!headers) {
    return {};
  }
  if (typeof Headers !== "undefined" && headers instanceof Headers) {
    const normalized: FetchHeaders = {};
    headers.forEach((value, key) => {
      normalized[key] = value;
    });
    return normalized;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...(headers as Record<string, string>) };
}

function createResponse(statusCode: number, data: unknown, header: Record<string, string>): WxFetchResponse {
  const headerMap = new Map(
    Object.entries(header).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    ok: statusCode >= 200 && statusCode < 300,
    status: statusCode,
    headers: {
      get(name: string) {
        return headerMap.get(name.toLowerCase()) ?? null;
      },
    },
    async json() {
      if (typeof data === "string") {
        return JSON.parse(data) as unknown;
      }
      return data;
    },
    async text() {
      return typeof data === "string" ? data : JSON.stringify(data);
    },
  };
}

function getWxRequest(): WechatMiniprogram.Wx {
  const candidate = (globalThis as { wx?: WechatMiniprogram.Wx }).wx;
  if (!candidate?.request) {
    throw new Error("WeChat wx.request is unavailable");
  }
  return candidate;
}

export function installWeixinFetch(): void {
  if (typeof globalThis.fetch === "function") {
    return;
  }

async function wxFetch(input: RequestInfo | URL, init: WxFetchInit = {}): Promise<Response> {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init.method ?? "GET").toUpperCase();
    const headers = normalizeHeaders(init.headers);
    const body =
      typeof init.body === "string"
        ? init.body
        : init.body == null
          ? undefined
          : JSON.stringify(init.body);

    if (body && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    const response = await new Promise<WxFetchResponse>((resolve, reject) => {
      const requestTask = getWxRequest().request({
        url,
        method: method as WechatMiniprogram.RequestOption["method"],
        header: headers,
        data: body,
        success(wxResponse) {
          resolve(
            createResponse(
              wxResponse.statusCode,
              wxResponse.data,
              (wxResponse.header as Record<string, string>) ?? {},
            ),
          );
        },
        fail(error) {
          reject(new Error(error.errMsg ?? "wx.request failed"));
        },
      });

      if (init.signal) {
        if (init.signal.aborted) {
          requestTask.abort();
          reject(new Error("Request was cancelled"));
          return;
        }
        init.signal.addEventListener(
          "abort",
          () => {
            requestTask.abort();
            reject(new Error("Request was cancelled"));
          },
          { once: true },
        );
      }
    });

    return response as unknown as Response;
  }

  (globalThis as { fetch: typeof fetch }).fetch = wxFetch as typeof fetch;
}
