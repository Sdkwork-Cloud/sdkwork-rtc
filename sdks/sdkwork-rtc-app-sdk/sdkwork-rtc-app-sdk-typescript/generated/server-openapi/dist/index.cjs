'use strict';

var sdkCommon = require('@sdkwork/sdk-common');

class HttpClient extends sdkCommon.BaseHttpClient {
    constructor(config) {
        super(config);
    }
    getInternalAuthConfig() {
        const self = this;
        self.authConfig = self.authConfig || {};
        return self.authConfig;
    }
    getInternalHeaders() {
        const self = this;
        self.config = self.config || {};
        self.config.headers = self.config.headers || {};
        return self.config.headers;
    }
    buildRequestHeaders(headers, contentType) {
        const mergedHeaders = {
            ...(headers ?? {}),
        };
        if (contentType && contentType.toLowerCase() !== 'multipart/form-data') {
            mergedHeaders['Content-Type'] = contentType;
        }
        return Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined;
    }
    buildHeaders(config, skipAuth = false) {
        const headers = super.buildHeaders(config, skipAuth);
        if (!skipAuth && !config?.skipAuth) {
            return headers;
        }
        [
            HttpClient.ACCESS_TOKEN_HEADER,
            'Authorization',
            'Access-Token',
            ['X', 'API', 'Key'].join('-'),
            'X-Tenant-Id',
            'X-Organization-Id',
            'X-Platform',
            'X-User-Id',
            'X-Sdkwork-Tenant-Id',
            'X-Sdkwork-Organization-Id',
            'X-Sdkwork-User-Id',
        ].forEach((key) => {
            delete headers[key];
        });
        return headers;
    }
    buildRequestBody(body, contentType) {
        if (body == null) {
            return body;
        }
        const normalizedContentType = (contentType ?? '').toLowerCase();
        if (normalizedContentType === 'application/x-www-form-urlencoded') {
            return this.encodeFormBody(body);
        }
        if (normalizedContentType === 'multipart/form-data') {
            return this.encodeMultipartBody(body);
        }
        return body;
    }
    encodeMultipartBody(body) {
        if (body instanceof FormData) {
            return body;
        }
        const formData = new FormData();
        if (body instanceof Map) {
            for (const [key, value] of body.entries()) {
                this.appendMultipartValue(formData, String(key), value);
            }
            return formData;
        }
        if (typeof body === 'object') {
            const record = body;
            for (const [key, value] of Object.entries(record)) {
                if (this.isMultipartMetadataField(key)) {
                    continue;
                }
                this.appendMultipartValue(formData, key, value, this.resolveMultipartFileName(record, key));
            }
            return formData;
        }
        this.appendMultipartValue(formData, 'value', body);
        return formData;
    }
    appendMultipartValue(formData, key, value, fileName) {
        if (value == null) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.appendMultipartValue(formData, key, item, fileName));
            return;
        }
        if (value instanceof Blob) {
            if (fileName) {
                formData.append(key, value, fileName);
                return;
            }
            formData.append(key, value);
            return;
        }
        if (value instanceof Date) {
            formData.append(key, value.toISOString());
            return;
        }
        if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
            return;
        }
        formData.append(key, String(value));
    }
    resolveMultipartFileName(record, key) {
        const fieldSpecificName = record[`${key}FileName`];
        if (typeof fieldSpecificName === 'string' && fieldSpecificName.trim()) {
            return fieldSpecificName.trim();
        }
        const genericName = record.fileName;
        if (key === 'file' && typeof genericName === 'string' && genericName.trim()) {
            return genericName.trim();
        }
        return undefined;
    }
    isMultipartMetadataField(key) {
        return key === 'fileName' || key.endsWith('FileName');
    }
    encodeFormBody(body) {
        if (body instanceof URLSearchParams) {
            return body.toString();
        }
        if (typeof body === 'string') {
            return body;
        }
        const params = new URLSearchParams();
        if (body instanceof Map) {
            for (const [key, value] of body.entries()) {
                this.appendFormValue(params, String(key), value);
            }
            return params.toString();
        }
        if (typeof body === 'object') {
            for (const [key, value] of Object.entries(body)) {
                this.appendFormValue(params, key, value);
            }
            return params.toString();
        }
        params.append('value', String(body));
        return params.toString();
    }
    appendFormValue(params, key, value) {
        if (value == null) {
            return;
        }
        if (Array.isArray(value)) {
            value.forEach((item) => this.appendFormValue(params, key, item));
            return;
        }
        if (value instanceof Date) {
            params.append(key, value.toISOString());
            return;
        }
        if (typeof value === 'object') {
            params.append(key, JSON.stringify(value));
            return;
        }
        params.append(key, String(value));
    }
    setAuthToken(token) {
        super.setAuthToken(token);
    }
    setAccessToken(token) {
        const headers = this.getInternalHeaders();
        headers[HttpClient.ACCESS_TOKEN_HEADER] = token;
        super.setAccessToken(token);
    }
    setTokenManager(manager) {
        const baseProto = Object.getPrototypeOf(HttpClient.prototype);
        if (typeof baseProto.setTokenManager === 'function') {
            baseProto.setTokenManager.call(this, manager);
            return;
        }
        this.getInternalAuthConfig().tokenManager = manager;
    }
    applySdkworkAuthHeaders(headers) {
        const authConfig = this.getInternalAuthConfig();
        const tokenManager = authConfig.tokenManager;
        const accessToken = tokenManager?.getAccessToken?.();
        if (!accessToken) {
            return headers;
        }
        return {
            ...(headers ?? {}),
            [HttpClient.ACCESS_TOKEN_HEADER]: accessToken,
        };
    }
    async request(path, options = {}) {
        const execute = this.execute;
        if (typeof execute !== 'function') {
            throw new Error('BaseHttpClient execute method is not available');
        }
        const { body, headers, contentType, method = 'GET', skipAuth, ...rest } = options;
        const requestHeaders = skipAuth ? headers : this.applySdkworkAuthHeaders(headers);
        return sdkCommon.withRetry(() => execute.call(this, {
            url: path,
            method,
            ...rest,
            skipAuth,
            body: this.buildRequestBody(body, contentType),
            headers: this.buildRequestHeaders(requestHeaders, body == null ? undefined : contentType),
        }), { maxRetries: 3 });
    }
    async *streamJson(path, options = {}) {
        const stream = sdkCommon.BaseHttpClient.prototype.stream;
        if (typeof stream !== 'function') {
            throw new Error('BaseHttpClient stream method is not available');
        }
        const { body, headers, contentType, method = 'GET', skipAuth, ...rest } = options;
        const authHeaders = skipAuth ? headers : this.applySdkworkAuthHeaders(headers);
        const requestHeaders = this.buildRequestHeaders({ Accept: 'text/event-stream', ...(authHeaders ?? {}) }, body == null ? undefined : contentType);
        for await (const data of stream.call(this, path, {
            method,
            ...rest,
            skipAuth,
            body: this.buildRequestBody(body, contentType),
            headers: requestHeaders,
        })) {
            if (data === '[DONE]') {
                return;
            }
            if (typeof data !== 'string' || data.trim().length === 0) {
                continue;
            }
            yield JSON.parse(data);
        }
    }
    async get(path, params, headers) {
        return this.request(path, { method: 'GET', params, headers });
    }
    async post(path, body, params, headers, contentType) {
        return this.request(path, { method: 'POST', body, params, headers, contentType });
    }
    async put(path, body, params, headers, contentType) {
        return this.request(path, { method: 'PUT', body, params, headers, contentType });
    }
    async delete(path, params, headers) {
        return this.request(path, { method: 'DELETE', params, headers });
    }
    async patch(path, body, params, headers, contentType) {
        return this.request(path, { method: 'PATCH', body, params, headers, contentType });
    }
}
HttpClient.ACCESS_TOKEN_HEADER = 'Access-Token';
function createHttpClient(config) {
    return new HttpClient(config);
}

const APP_API_PREFIX = '/app/v3/api';
function appApiPath(path) {
    if (!path) {
        return APP_API_PREFIX;
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedPrefixRaw = (APP_API_PREFIX).trim();
    const normalizedPrefix = normalizedPrefixRaw
        ? `/${normalizedPrefixRaw.replace(/^\/+|\/+$/g, '')}`
        : '';
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (!normalizedPrefix || normalizedPrefix === '/') {
        return normalizedPath;
    }
    if (normalizedPath === normalizedPrefix || normalizedPath.startsWith(`${normalizedPrefix}/`)) {
        return normalizedPath;
    }
    return `${normalizedPrefix}${normalizedPath}`;
}

class RtcMediaSessionsRtcMediaSessionsCompletionRecordApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc media Sessions completion Record retrieve. */
    async retrieve(mediaSessionId) {
        return this.client.get(appApiPath(`/rtc/media_sessions/${serializePathParameter$3(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}/completion_record`));
    }
}
class RtcMediaSessionsRtcMediaSessionsApi {
    constructor(client) {
        this.client = client;
        this.completionRecord = new RtcMediaSessionsRtcMediaSessionsCompletionRecordApi(client);
    }
    /** Rtc media Sessions list. */
    async list(params) {
        const query = buildQueryString$3([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$3(appApiPath(`/rtc/media_sessions`), query));
    }
    /** Rtc media Sessions create. */
    async create(body) {
        return this.client.post(appApiPath(`/rtc/media_sessions`), body, undefined, undefined, 'application/json');
    }
    /** Rtc media Sessions retrieve. */
    async retrieve(mediaSessionId) {
        return this.client.get(appApiPath(`/rtc/media_sessions/${serializePathParameter$3(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}`));
    }
}
class RtcMediaSessionsRtcApi {
    constructor(client) {
        this.client = client;
        this.mediaSessions = new RtcMediaSessionsRtcMediaSessionsApi(client);
    }
}
class RtcMediaSessionsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcMediaSessionsRtcApi(client);
    }
}
function createRtcMediaSessionsApi(client) {
    return new RtcMediaSessionsApi(client);
}
function appendQueryString$3(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$3(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$3(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$3(spec.name, value, style, spec.explode);
    }
    return pathPrefix$3(spec.name, style) + encodePathValue$3(serializePathPrimitive$3(value));
}
function serializePathArray$3(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$3(serializePathPrimitive$3(item)));
    if (serialized.length === 0) {
        return pathPrefix$3(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$3(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$3(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$3(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$3(key)}=${encodePathValue$3(serializePathPrimitive$3(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$3(key), encodePathValue$3(serializePathPrimitive$3(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$3(key)}=${encodePathValue$3(serializePathPrimitive$3(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$3(key), encodePathValue$3(serializePathPrimitive$3(entryValue))]).join(',');
    return pathPrefix$3(name, style) + serialized;
}
function pathPrefix$3(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$3(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$3(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$3(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$3(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$3(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$3(parameter.name)}=${encodeQueryValue$3(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$3(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$3(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$3(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$3(parameter.name)}=${encodeQueryValue$3(serializePrimitive$3(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$3(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$3(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$3(name)}=${encodeQueryValue$3(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$3(name)}=${encodeQueryValue$3(values.join(','), allowReserved)}`);
}
function appendObjectParameter$3(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$3(key)}=${encodeQueryValue$3(serializePrimitive$3(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$3(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$3(name)}=${encodeQueryValue$3(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$3(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$3(name)}=${encodeQueryValue$3(serializePrimitive$3(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$3(`${name}[${key}]`)}=${encodeQueryValue$3(serializePrimitive$3(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$3(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$3(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$3(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}

class RtcParticipantCredentialsRtcMediaSessionsParticipantCredentialsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc media Sessions participant Credentials issue. */
    async issue(mediaSessionId, participantId, body) {
        return this.client.post(appApiPath(`/rtc/media_sessions/${serializePathParameter$2(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}/participants/${serializePathParameter$2(participantId, { name: 'participantId', style: 'simple', explode: false })}/credential`), body, undefined, undefined, 'application/json');
    }
}
class RtcParticipantCredentialsRtcMediaSessionsApi {
    constructor(client) {
        this.client = client;
        this.participantCredentials = new RtcParticipantCredentialsRtcMediaSessionsParticipantCredentialsApi(client);
    }
}
class RtcParticipantCredentialsRtcApi {
    constructor(client) {
        this.client = client;
        this.mediaSessions = new RtcParticipantCredentialsRtcMediaSessionsApi(client);
    }
}
class RtcParticipantCredentialsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcParticipantCredentialsRtcApi(client);
    }
}
function createRtcParticipantCredentialsApi(client) {
    return new RtcParticipantCredentialsApi(client);
}
function serializePathParameter$2(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$2(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$2(spec.name, value, style, spec.explode);
    }
    return pathPrefix$2(spec.name, style) + encodePathValue$2(serializePathPrimitive$2(value));
}
function serializePathArray$2(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$2(serializePathPrimitive$2(item)));
    if (serialized.length === 0) {
        return pathPrefix$2(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$2(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$2(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$2(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$2(key)}=${encodePathValue$2(serializePathPrimitive$2(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$2(key), encodePathValue$2(serializePathPrimitive$2(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$2(key)}=${encodePathValue$2(serializePathPrimitive$2(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$2(key), encodePathValue$2(serializePathPrimitive$2(entryValue))]).join(',');
    return pathPrefix$2(name, style) + serialized;
}
function pathPrefix$2(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$2(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$2(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}

class RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc media Sessions recording Artifacts list. */
    async list(mediaSessionId, params) {
        const query = buildQueryString$2([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$2(appApiPath(`/rtc/media_sessions/${serializePathParameter$1(mediaSessionId, { name: 'mediaSessionId'})}/recording_artifacts`), query));
    }
}
class RtcRecordingArtifactsRtcMediaSessionsApi {
    constructor(client) {
        this.client = client;
        this.recordingArtifacts = new RtcRecordingArtifactsRtcMediaSessionsRecordingArtifactsApi(client);
    }
}
class RtcRecordingArtifactsRtcApi {
    constructor(client) {
        this.client = client;
        this.mediaSessions = new RtcRecordingArtifactsRtcMediaSessionsApi(client);
    }
}
class RtcRecordingArtifactsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcRecordingArtifactsRtcApi(client);
    }
}
function createRtcRecordingArtifactsApi(client) {
    return new RtcRecordingArtifactsApi(client);
}
function appendQueryString$2(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$1(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    if (Array.isArray(value)) {
        return serializePathArray$1(spec.name, value);
    }
    if (typeof value === 'object') {
        return serializePathObject$1(spec.name, value);
    }
    return pathPrefix$1() + encodePathValue$1(serializePathPrimitive$1(value));
}
function serializePathArray$1(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$1(serializePathPrimitive$1(item)));
    if (serialized.length === 0) {
        return pathPrefix$1();
    }
    return pathPrefix$1() + serialized.join(',');
}
function serializePathObject$1(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$1();
    }
    const serialized = entries.flatMap(([key, entryValue]) => [encodePathValue$1(key), encodePathValue$1(serializePathPrimitive$1(entryValue))]).join(',');
    return pathPrefix$1() + serialized;
}
function pathPrefix$1(name, style, _objectValue) {
    return '';
}
function encodePathValue$1(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$1(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$2(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$2(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$2(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$2(parameter.name)}=${encodeQueryValue$2(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$2(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$2(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$2(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$2(parameter.name)}=${encodeQueryValue$2(serializePrimitive$2(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$2(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$2(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$2(name)}=${encodeQueryValue$2(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$2(name)}=${encodeQueryValue$2(values.join(','), allowReserved)}`);
}
function appendObjectParameter$2(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$2(key)}=${encodeQueryValue$2(serializePrimitive$2(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$2(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$2(name)}=${encodeQueryValue$2(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$2(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$2(name)}=${encodeQueryValue$2(serializePrimitive$2(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$2(`${name}[${key}]`)}=${encodeQueryValue$2(serializePrimitive$2(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$2(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$2(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$2(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}

class RtcProviderProfilesRtcProviderProfilesActiveApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Profiles active list. */
    async list(params) {
        const query = buildQueryString$1([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$1(appApiPath(`/rtc/provider_profiles/active`), query));
    }
}
class RtcProviderProfilesRtcProviderProfilesApi {
    constructor(client) {
        this.client = client;
        this.active = new RtcProviderProfilesRtcProviderProfilesActiveApi(client);
    }
}
class RtcProviderProfilesRtcApi {
    constructor(client) {
        this.client = client;
        this.providerProfiles = new RtcProviderProfilesRtcProviderProfilesApi(client);
    }
}
class RtcProviderProfilesApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderProfilesRtcApi(client);
    }
}
function createRtcProviderProfilesApi(client) {
    return new RtcProviderProfilesApi(client);
}
function appendQueryString$1(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function buildQueryString$1(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$1(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$1(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$1(parameter.name)}=${encodeQueryValue$1(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$1(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$1(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$1(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$1(parameter.name)}=${encodeQueryValue$1(serializePrimitive$1(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$1(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$1(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$1(name)}=${encodeQueryValue$1(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$1(name)}=${encodeQueryValue$1(values.join(','), allowReserved)}`);
}
function appendObjectParameter$1(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$1(key)}=${encodeQueryValue$1(serializePrimitive$1(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$1(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$1(name)}=${encodeQueryValue$1(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$1(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$1(name)}=${encodeQueryValue$1(serializePrimitive$1(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$1(`${name}[${key}]`)}=${encodeQueryValue$1(serializePrimitive$1(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$1(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$1(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$1(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}

class RtcRoomsRtcRoomsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc rooms list. */
    async list(params) {
        const query = buildQueryString([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString(appApiPath(`/rtc/rooms`), query));
    }
    /** Rtc rooms retrieve. */
    async retrieve(roomId) {
        return this.client.get(appApiPath(`/rtc/rooms/${serializePathParameter(roomId, { name: 'roomId'})}`));
    }
}
class RtcRoomsRtcApi {
    constructor(client) {
        this.client = client;
        this.rooms = new RtcRoomsRtcRoomsApi(client);
    }
}
class RtcRoomsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcRoomsRtcApi(client);
    }
}
function createRtcRoomsApi(client) {
    return new RtcRoomsApi(client);
}
function appendQueryString(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    if (Array.isArray(value)) {
        return serializePathArray(spec.name, value);
    }
    if (typeof value === 'object') {
        return serializePathObject(spec.name, value);
    }
    return pathPrefix() + encodePathValue(serializePathPrimitive(value));
}
function serializePathArray(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue(serializePathPrimitive(item)));
    if (serialized.length === 0) {
        return pathPrefix();
    }
    return pathPrefix() + serialized.join(',');
}
function serializePathObject(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix();
    }
    const serialized = entries.flatMap(([key, entryValue]) => [encodePathValue(key), encodePathValue(serializePathPrimitive(entryValue))]).join(',');
    return pathPrefix() + serialized;
}
function pathPrefix(name, style, _objectValue) {
    return '';
}
function encodePathValue(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent(parameter.name)}=${encodeQueryValue(serializePrimitive(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(values.join(','), allowReserved)}`);
}
function appendObjectParameter(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent(key)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serialized, allowReserved)}`);
}
function appendDeepObjectParameter(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent(name)}=${encodeQueryValue(serializePrimitive(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent(`${name}[${key}]`)}=${encodeQueryValue(serializePrimitive(entryValue), allowReserved)}`);
    }
}
function serializePrimitive(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue(value, allowReserved) {
    const encoded = encodeURIComponent(value);
    if (!allowReserved) {
        return encoded;
    }
    return encoded.replace(/%3A/gi, ':')
        .replace(/%2F/gi, '/')
        .replace(/%3F/gi, '?')
        .replace(/%23/gi, '#')
        .replace(/%5B/gi, '[')
        .replace(/%5D/gi, ']')
        .replace(/%40/gi, '@')
        .replace(/%21/gi, '!')
        .replace(/%24/gi, '$')
        .replace(/%26/gi, '&')
        .replace(/%27/gi, "'")
        .replace(/%28/gi, '(')
        .replace(/%29/gi, ')')
        .replace(/%2A/gi, '*')
        .replace(/%2B/gi, '+')
        .replace(/%2C/gi, ',')
        .replace(/%3B/gi, ';')
        .replace(/%3D/gi, '=');
}

class SdkworkAppClient {
    constructor(config) {
        this.httpClient = createHttpClient(config);
        this.rtcMediaSessions = createRtcMediaSessionsApi(this.httpClient);
        this.rtcParticipantCredentials = createRtcParticipantCredentialsApi(this.httpClient);
        this.rtcRecordingArtifacts = createRtcRecordingArtifactsApi(this.httpClient);
        this.rtcProviderProfiles = createRtcProviderProfilesApi(this.httpClient);
        this.rtcRooms = createRtcRoomsApi(this.httpClient);
    }
    setAuthToken(token) {
        this.httpClient.setAuthToken(token);
        return this;
    }
    setAccessToken(token) {
        this.httpClient.setAccessToken(token);
        return this;
    }
    setTokenManager(manager) {
        this.httpClient.setTokenManager(manager);
        return this;
    }
    get http() {
        return this.httpClient;
    }
}
function createClient(config) {
    return new SdkworkAppClient(config);
}

class BaseApi {
    constructor(http, basePath) {
        this.http = http;
        this.basePath = basePath;
    }
    async get(path, params, headers) {
        return this.http.get(`${this.basePath}${path}`, params, headers);
    }
    async post(path, body, params, headers, contentType) {
        return this.http.post(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async put(path, body, params, headers, contentType) {
        return this.http.put(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async delete(path, params, headers) {
        return this.http.delete(`${this.basePath}${path}`, params, headers);
    }
    async patch(path, body, params, headers, contentType) {
        return this.http.patch(`${this.basePath}${path}`, body, params, headers, contentType);
    }
    async request(method, path, body, params, headers, contentType) {
        return this.http.request(`${this.basePath}${path}`, { method: method, body, params, headers, contentType });
    }
}

Object.defineProperty(exports, "DEFAULT_TIMEOUT", {
    enumerable: true,
    get: function () { return sdkCommon.DEFAULT_TIMEOUT; }
});
Object.defineProperty(exports, "DefaultAuthTokenManager", {
    enumerable: true,
    get: function () { return sdkCommon.DefaultAuthTokenManager; }
});
Object.defineProperty(exports, "SUCCESS_CODES", {
    enumerable: true,
    get: function () { return sdkCommon.SUCCESS_CODES; }
});
Object.defineProperty(exports, "createTokenManager", {
    enumerable: true,
    get: function () { return sdkCommon.createTokenManager; }
});
exports.BaseApi = BaseApi;
exports.HttpClient = HttpClient;
exports.RtcMediaSessionsApi = RtcMediaSessionsApi;
exports.RtcParticipantCredentialsApi = RtcParticipantCredentialsApi;
exports.RtcProviderProfilesApi = RtcProviderProfilesApi;
exports.RtcRecordingArtifactsApi = RtcRecordingArtifactsApi;
exports.RtcRoomsApi = RtcRoomsApi;
exports.SdkworkAppClient = SdkworkAppClient;
exports.appApiPath = appApiPath;
exports.createClient = createClient;
exports.createHttpClient = createHttpClient;
exports.createRtcMediaSessionsApi = createRtcMediaSessionsApi;
exports.createRtcParticipantCredentialsApi = createRtcParticipantCredentialsApi;
exports.createRtcProviderProfilesApi = createRtcProviderProfilesApi;
exports.createRtcRecordingArtifactsApi = createRtcRecordingArtifactsApi;
exports.createRtcRoomsApi = createRtcRoomsApi;
