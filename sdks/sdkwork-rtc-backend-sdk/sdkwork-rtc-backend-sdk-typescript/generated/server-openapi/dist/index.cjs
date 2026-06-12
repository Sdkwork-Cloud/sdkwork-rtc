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

const BACKEND_API_PREFIX = '/backend/v3/api';
function backendApiPath(path) {
    if (!path) {
        return BACKEND_API_PREFIX;
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const normalizedPrefixRaw = (BACKEND_API_PREFIX).trim();
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

class RtcMediaArtifactsRtcMediaArtifactsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc media Artifacts list. */
    async list(params) {
        const query = buildQueryString$a([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$a(backendApiPath(`/rtc/media_artifacts`), query));
    }
    /** Rtc media Artifacts retrieve. */
    async retrieve(mediaArtifactId) {
        return this.client.get(backendApiPath(`/rtc/media_artifacts/${serializePathParameter$8(mediaArtifactId, { name: 'mediaArtifactId'})}`));
    }
}
class RtcMediaArtifactsRtcApi {
    constructor(client) {
        this.client = client;
        this.mediaArtifacts = new RtcMediaArtifactsRtcMediaArtifactsApi(client);
    }
}
class RtcMediaArtifactsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcMediaArtifactsRtcApi(client);
    }
}
function createRtcMediaArtifactsApi(client) {
    return new RtcMediaArtifactsApi(client);
}
function appendQueryString$a(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$8(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    if (Array.isArray(value)) {
        return serializePathArray$8(spec.name, value);
    }
    if (typeof value === 'object') {
        return serializePathObject$8(spec.name, value);
    }
    return pathPrefix$8() + encodePathValue$8(serializePathPrimitive$8(value));
}
function serializePathArray$8(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$8(serializePathPrimitive$8(item)));
    if (serialized.length === 0) {
        return pathPrefix$8();
    }
    return pathPrefix$8() + serialized.join(',');
}
function serializePathObject$8(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$8();
    }
    const serialized = entries.flatMap(([key, entryValue]) => [encodePathValue$8(key), encodePathValue$8(serializePathPrimitive$8(entryValue))]).join(',');
    return pathPrefix$8() + serialized;
}
function pathPrefix$8(name, style, _objectValue) {
    return '';
}
function encodePathValue$8(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$8(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$a(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$a(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$a(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$a(parameter.name)}=${encodeQueryValue$a(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$a(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$a(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$a(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$a(parameter.name)}=${encodeQueryValue$a(serializePrimitive$a(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$a(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$a(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$a(name)}=${encodeQueryValue$a(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$a(name)}=${encodeQueryValue$a(values.join(','), allowReserved)}`);
}
function appendObjectParameter$a(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$a(key)}=${encodeQueryValue$a(serializePrimitive$a(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$a(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$a(name)}=${encodeQueryValue$a(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$a(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$a(name)}=${encodeQueryValue$a(serializePrimitive$a(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$a(`${name}[${key}]`)}=${encodeQueryValue$a(serializePrimitive$a(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$a(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$a(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$a(value, allowReserved) {
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

class RtcMediaSessionsRtcMediaSessionsCompletionRecordApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc media Sessions completion Record retrieve. */
    async retrieve(mediaSessionId) {
        return this.client.get(backendApiPath(`/rtc/media_sessions/${serializePathParameter$7(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}/completion_record`));
    }
}
class RtcMediaSessionsRtcMediaSessionsApi {
    constructor(client) {
        this.client = client;
        this.completionRecord = new RtcMediaSessionsRtcMediaSessionsCompletionRecordApi(client);
    }
    /** Rtc media Sessions list. */
    async list(params) {
        const query = buildQueryString$9([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$9(backendApiPath(`/rtc/media_sessions`), query));
    }
    /** Rtc media Sessions retrieve. */
    async retrieve(mediaSessionId) {
        return this.client.get(backendApiPath(`/rtc/media_sessions/${serializePathParameter$7(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}`));
    }
    /** Rtc media Sessions close. */
    async close(mediaSessionId, body) {
        return this.client.post(backendApiPath(`/rtc/media_sessions/${serializePathParameter$7(mediaSessionId, { name: 'mediaSessionId', style: 'simple', explode: false })}/close`), body, undefined, undefined, 'application/json');
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
function appendQueryString$9(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$7(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$7(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$7(spec.name, value, style, spec.explode);
    }
    return pathPrefix$7(spec.name, style) + encodePathValue$7(serializePathPrimitive$7(value));
}
function serializePathArray$7(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$7(serializePathPrimitive$7(item)));
    if (serialized.length === 0) {
        return pathPrefix$7(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$7(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$7(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$7(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$7(key)}=${encodePathValue$7(serializePathPrimitive$7(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$7(key), encodePathValue$7(serializePathPrimitive$7(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$7(key)}=${encodePathValue$7(serializePathPrimitive$7(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$7(key), encodePathValue$7(serializePathPrimitive$7(entryValue))]).join(',');
    return pathPrefix$7(name, style) + serialized;
}
function pathPrefix$7(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$7(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$7(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$9(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$9(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$9(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$9(parameter.name)}=${encodeQueryValue$9(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$9(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$9(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$9(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$9(parameter.name)}=${encodeQueryValue$9(serializePrimitive$9(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$9(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$9(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$9(name)}=${encodeQueryValue$9(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$9(name)}=${encodeQueryValue$9(values.join(','), allowReserved)}`);
}
function appendObjectParameter$9(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$9(key)}=${encodeQueryValue$9(serializePrimitive$9(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$9(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$9(name)}=${encodeQueryValue$9(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$9(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$9(name)}=${encodeQueryValue$9(serializePrimitive$9(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$9(`${name}[${key}]`)}=${encodeQueryValue$9(serializePrimitive$9(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$9(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$9(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$9(value, allowReserved) {
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

class RtcProviderAccountsRtcProviderAccountsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Accounts list. */
    async list(params) {
        const query = buildQueryString$8([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$8(backendApiPath(`/rtc/provider_accounts`), query));
    }
    /** Rtc provider Accounts create. */
    async create(body) {
        return this.client.post(backendApiPath(`/rtc/provider_accounts`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Accounts retrieve. */
    async retrieve(providerAccountId) {
        return this.client.get(backendApiPath(`/rtc/provider_accounts/${serializePathParameter$6(providerAccountId, { name: 'providerAccountId', style: 'simple', explode: false })}`));
    }
    /** Rtc provider Accounts update. */
    async update(providerAccountId, body) {
        return this.client.patch(backendApiPath(`/rtc/provider_accounts/${serializePathParameter$6(providerAccountId, { name: 'providerAccountId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Accounts disable. */
    async disable(providerAccountId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_accounts/${serializePathParameter$6(providerAccountId, { name: 'providerAccountId', style: 'simple', explode: false })}/disable`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderAccountsRtcApi {
    constructor(client) {
        this.client = client;
        this.providerAccounts = new RtcProviderAccountsRtcProviderAccountsApi(client);
    }
}
class RtcProviderAccountsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderAccountsRtcApi(client);
    }
}
function createRtcProviderAccountsApi(client) {
    return new RtcProviderAccountsApi(client);
}
function appendQueryString$8(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$6(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$6(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$6(spec.name, value, style, spec.explode);
    }
    return pathPrefix$6(spec.name, style) + encodePathValue$6(serializePathPrimitive$6(value));
}
function serializePathArray$6(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$6(serializePathPrimitive$6(item)));
    if (serialized.length === 0) {
        return pathPrefix$6(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$6(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$6(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$6(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$6(key)}=${encodePathValue$6(serializePathPrimitive$6(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$6(key), encodePathValue$6(serializePathPrimitive$6(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$6(key)}=${encodePathValue$6(serializePathPrimitive$6(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$6(key), encodePathValue$6(serializePathPrimitive$6(entryValue))]).join(',');
    return pathPrefix$6(name, style) + serialized;
}
function pathPrefix$6(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$6(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$6(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$8(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$8(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$8(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$8(parameter.name)}=${encodeQueryValue$8(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$8(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$8(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$8(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$8(parameter.name)}=${encodeQueryValue$8(serializePrimitive$8(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$8(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$8(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$8(name)}=${encodeQueryValue$8(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$8(name)}=${encodeQueryValue$8(values.join(','), allowReserved)}`);
}
function appendObjectParameter$8(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$8(key)}=${encodeQueryValue$8(serializePrimitive$8(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$8(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$8(name)}=${encodeQueryValue$8(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$8(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$8(name)}=${encodeQueryValue$8(serializePrimitive$8(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$8(`${name}[${key}]`)}=${encodeQueryValue$8(serializePrimitive$8(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$8(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$8(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$8(value, allowReserved) {
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

class RtcProviderApplicationsRtcProviderApplicationsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Applications retrieve. */
    async retrieve(providerApplicationId) {
        return this.client.get(backendApiPath(`/rtc/provider_applications/${serializePathParameter$5(providerApplicationId, { name: 'providerApplicationId', style: 'simple', explode: false })}`));
    }
    /** Rtc provider Applications update. */
    async update(providerApplicationId, body) {
        return this.client.patch(backendApiPath(`/rtc/provider_applications/${serializePathParameter$5(providerApplicationId, { name: 'providerApplicationId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Applications disable. */
    async disable(providerApplicationId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_applications/${serializePathParameter$5(providerApplicationId, { name: 'providerApplicationId', style: 'simple', explode: false })}/disable`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderApplicationsRtcProviderAccountsApplicationsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Accounts applications list. */
    async list(providerAccountId, params) {
        const query = buildQueryString$7([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$7(backendApiPath(`/rtc/provider_accounts/${serializePathParameter$5(providerAccountId, { name: 'providerAccountId', style: 'simple', explode: false })}/applications`), query));
    }
    /** Rtc provider Accounts applications create. */
    async create(providerAccountId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_accounts/${serializePathParameter$5(providerAccountId, { name: 'providerAccountId', style: 'simple', explode: false })}/applications`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderApplicationsRtcProviderAccountsApi {
    constructor(client) {
        this.client = client;
        this.applications = new RtcProviderApplicationsRtcProviderAccountsApplicationsApi(client);
    }
}
class RtcProviderApplicationsRtcApi {
    constructor(client) {
        this.client = client;
        this.providerAccounts = new RtcProviderApplicationsRtcProviderAccountsApi(client);
        this.providerApplications = new RtcProviderApplicationsRtcProviderApplicationsApi(client);
    }
}
class RtcProviderApplicationsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderApplicationsRtcApi(client);
    }
}
function createRtcProviderApplicationsApi(client) {
    return new RtcProviderApplicationsApi(client);
}
function appendQueryString$7(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$5(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$5(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$5(spec.name, value, style, spec.explode);
    }
    return pathPrefix$5(spec.name, style) + encodePathValue$5(serializePathPrimitive$5(value));
}
function serializePathArray$5(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$5(serializePathPrimitive$5(item)));
    if (serialized.length === 0) {
        return pathPrefix$5(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$5(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$5(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$5(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$5(key)}=${encodePathValue$5(serializePathPrimitive$5(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$5(key), encodePathValue$5(serializePathPrimitive$5(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$5(key)}=${encodePathValue$5(serializePathPrimitive$5(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$5(key), encodePathValue$5(serializePathPrimitive$5(entryValue))]).join(',');
    return pathPrefix$5(name, style) + serialized;
}
function pathPrefix$5(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$5(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$5(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$7(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$7(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$7(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$7(parameter.name)}=${encodeQueryValue$7(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$7(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$7(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$7(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$7(parameter.name)}=${encodeQueryValue$7(serializePrimitive$7(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$7(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$7(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$7(name)}=${encodeQueryValue$7(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$7(name)}=${encodeQueryValue$7(values.join(','), allowReserved)}`);
}
function appendObjectParameter$7(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$7(key)}=${encodeQueryValue$7(serializePrimitive$7(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$7(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$7(name)}=${encodeQueryValue$7(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$7(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$7(name)}=${encodeQueryValue$7(serializePrimitive$7(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$7(`${name}[${key}]`)}=${encodeQueryValue$7(serializePrimitive$7(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$7(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$7(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$7(value, allowReserved) {
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

class RtcProviderCredentialsRtcProviderCredentialsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Credentials retrieve. */
    async retrieve(providerCredentialId) {
        return this.client.get(backendApiPath(`/rtc/provider_credentials/${serializePathParameter$4(providerCredentialId, { name: 'providerCredentialId', style: 'simple', explode: false })}`));
    }
    /** Rtc provider Credentials update. */
    async update(providerCredentialId, body) {
        return this.client.patch(backendApiPath(`/rtc/provider_credentials/${serializePathParameter$4(providerCredentialId, { name: 'providerCredentialId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Credentials revoke. */
    async revoke(providerCredentialId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_credentials/${serializePathParameter$4(providerCredentialId, { name: 'providerCredentialId', style: 'simple', explode: false })}/revoke`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderCredentialsRtcProviderApplicationsCredentialsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Applications credentials list. */
    async list(providerApplicationId, params) {
        const query = buildQueryString$6([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$6(backendApiPath(`/rtc/provider_applications/${serializePathParameter$4(providerApplicationId, { name: 'providerApplicationId', style: 'simple', explode: false })}/credentials`), query));
    }
    /** Rtc provider Applications credentials create. */
    async create(providerApplicationId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_applications/${serializePathParameter$4(providerApplicationId, { name: 'providerApplicationId', style: 'simple', explode: false })}/credentials`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderCredentialsRtcProviderApplicationsApi {
    constructor(client) {
        this.client = client;
        this.credentials = new RtcProviderCredentialsRtcProviderApplicationsCredentialsApi(client);
    }
}
class RtcProviderCredentialsRtcApi {
    constructor(client) {
        this.client = client;
        this.providerApplications = new RtcProviderCredentialsRtcProviderApplicationsApi(client);
        this.providerCredentials = new RtcProviderCredentialsRtcProviderCredentialsApi(client);
    }
}
class RtcProviderCredentialsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderCredentialsRtcApi(client);
    }
}
function createRtcProviderCredentialsApi(client) {
    return new RtcProviderCredentialsApi(client);
}
function appendQueryString$6(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
}
function serializePathParameter$4(value, spec) {
    if (value === undefined || value === null) {
        return '';
    }
    const style = spec.style || 'simple';
    if (Array.isArray(value)) {
        return serializePathArray$4(spec.name, value, style, spec.explode);
    }
    if (typeof value === 'object') {
        return serializePathObject$4(spec.name, value, style, spec.explode);
    }
    return pathPrefix$4(spec.name, style) + encodePathValue$4(serializePathPrimitive$4(value));
}
function serializePathArray$4(name, values, style, explode) {
    const serialized = values
        .filter((item) => item !== undefined && item !== null)
        .map((item) => encodePathValue$4(serializePathPrimitive$4(item)));
    if (serialized.length === 0) {
        return pathPrefix$4(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? serialized.map((item) => `;${name}=${item}`).join('')
            : `;${name}=${serialized.join(',')}`;
    }
    return pathPrefix$4(name, style) + serialized.join(explode ? '.' : ',');
}
function serializePathObject$4(name, value, style, explode) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return pathPrefix$4(name, style);
    }
    if (style === 'matrix') {
        return explode
            ? entries.map(([key, entryValue]) => `;${encodePathValue$4(key)}=${encodePathValue$4(serializePathPrimitive$4(entryValue))}`).join('')
            : `;${name}=${entries.flatMap(([key, entryValue]) => [encodePathValue$4(key), encodePathValue$4(serializePathPrimitive$4(entryValue))]).join(',')}`;
    }
    const serialized = explode
        ? entries.map(([key, entryValue]) => `${encodePathValue$4(key)}=${encodePathValue$4(serializePathPrimitive$4(entryValue))}`).join(style === 'label' ? '.' : ',')
        : entries.flatMap(([key, entryValue]) => [encodePathValue$4(key), encodePathValue$4(serializePathPrimitive$4(entryValue))]).join(',');
    return pathPrefix$4(name, style) + serialized;
}
function pathPrefix$4(name, style, _objectValue) {
    if (style === 'label')
        return '.';
    if (style === 'matrix')
        return `;${name}`;
    return '';
}
function encodePathValue$4(value) {
    return encodeURIComponent(value);
}
function serializePathPrimitive$4(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function buildQueryString$6(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$6(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$6(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$6(parameter.name)}=${encodeQueryValue$6(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$6(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$6(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$6(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$6(parameter.name)}=${encodeQueryValue$6(serializePrimitive$6(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$6(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$6(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$6(name)}=${encodeQueryValue$6(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$6(name)}=${encodeQueryValue$6(values.join(','), allowReserved)}`);
}
function appendObjectParameter$6(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$6(key)}=${encodeQueryValue$6(serializePrimitive$6(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$6(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$6(name)}=${encodeQueryValue$6(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$6(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$6(name)}=${encodeQueryValue$6(serializePrimitive$6(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$6(`${name}[${key}]`)}=${encodeQueryValue$6(serializePrimitive$6(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$6(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$6(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$6(value, allowReserved) {
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

class RtcProviderProfilesRtcProviderProfilesApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Profiles list. */
    async list(params) {
        const query = buildQueryString$5([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$5(backendApiPath(`/rtc/provider_profiles`), query));
    }
    /** Rtc provider Profiles create. */
    async create(body) {
        return this.client.post(backendApiPath(`/rtc/provider_profiles`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Profiles retrieve. */
    async retrieve(providerProfileId) {
        return this.client.get(backendApiPath(`/rtc/provider_profiles/${serializePathParameter$3(providerProfileId, { name: 'providerProfileId', style: 'simple', explode: false })}`));
    }
    /** Rtc provider Profiles update. */
    async update(providerProfileId, body) {
        return this.client.patch(backendApiPath(`/rtc/provider_profiles/${serializePathParameter$3(providerProfileId, { name: 'providerProfileId', style: 'simple', explode: false })}`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Profiles disable. */
    async disable(providerProfileId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_profiles/${serializePathParameter$3(providerProfileId, { name: 'providerProfileId', style: 'simple', explode: false })}/disable`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Profiles verify. */
    async verify(providerProfileId, body) {
        return this.client.post(backendApiPath(`/rtc/provider_profiles/${serializePathParameter$3(providerProfileId, { name: 'providerProfileId', style: 'simple', explode: false })}/verify`), body, undefined, undefined, 'application/json');
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
function appendQueryString$5(path, rawQueryString) {
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
function buildQueryString$5(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$5(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$5(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$5(parameter.name)}=${encodeQueryValue$5(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$5(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$5(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$5(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$5(parameter.name)}=${encodeQueryValue$5(serializePrimitive$5(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$5(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$5(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$5(name)}=${encodeQueryValue$5(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$5(name)}=${encodeQueryValue$5(values.join(','), allowReserved)}`);
}
function appendObjectParameter$5(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$5(key)}=${encodeQueryValue$5(serializePrimitive$5(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$5(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$5(name)}=${encodeQueryValue$5(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$5(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$5(name)}=${encodeQueryValue$5(serializePrimitive$5(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$5(`${name}[${key}]`)}=${encodeQueryValue$5(serializePrimitive$5(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$5(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$5(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$5(value, allowReserved) {
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

class RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Query Jobs snapshots list. */
    async list(providerQueryJobId, params) {
        const query = buildQueryString$4([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$4(backendApiPath(`/rtc/provider_query_jobs/${serializePathParameter$2(providerQueryJobId, { name: 'providerQueryJobId', style: 'simple', explode: false })}/snapshots`), query));
    }
}
class RtcProviderQueryJobsRtcProviderQueryJobsApi {
    constructor(client) {
        this.client = client;
        this.snapshots = new RtcProviderQueryJobsRtcProviderQueryJobsSnapshotsApi(client);
    }
    /** Rtc provider Query Jobs create. */
    async create(body) {
        return this.client.post(backendApiPath(`/rtc/provider_query_jobs`), body, undefined, undefined, 'application/json');
    }
    /** Rtc provider Query Jobs retrieve. */
    async retrieve(providerQueryJobId) {
        return this.client.get(backendApiPath(`/rtc/provider_query_jobs/${serializePathParameter$2(providerQueryJobId, { name: 'providerQueryJobId', style: 'simple', explode: false })}`));
    }
}
class RtcProviderQueryJobsRtcApi {
    constructor(client) {
        this.client = client;
        this.providerQueryJobs = new RtcProviderQueryJobsRtcProviderQueryJobsApi(client);
    }
}
class RtcProviderQueryJobsApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderQueryJobsRtcApi(client);
    }
}
function createRtcProviderQueryJobsApi(client) {
    return new RtcProviderQueryJobsApi(client);
}
function appendQueryString$4(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
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
function buildQueryString$4(parameters) {
    const pairs = [];
    for (const parameter of parameters) {
        appendSerializedParameter$4(pairs, parameter);
    }
    return pairs.join('&');
}
function appendSerializedParameter$4(pairs, parameter) {
    if (parameter.value === undefined || parameter.value === null) {
        return;
    }
    if (parameter.contentType) {
        pairs.push(`${encodeQueryComponent$4(parameter.name)}=${encodeQueryValue$4(JSON.stringify(parameter.value), parameter.allowReserved)}`);
        return;
    }
    const style = parameter.style || 'form';
    if (style === 'deepObject') {
        appendDeepObjectParameter$4(pairs, parameter.name, parameter.value, parameter.allowReserved);
        return;
    }
    if (Array.isArray(parameter.value)) {
        appendArrayParameter$4(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    if (typeof parameter.value === 'object') {
        appendObjectParameter$4(pairs, parameter.name, parameter.value, style, parameter.explode, parameter.allowReserved);
        return;
    }
    pairs.push(`${encodeQueryComponent$4(parameter.name)}=${encodeQueryValue$4(serializePrimitive$4(parameter.value), parameter.allowReserved)}`);
}
function appendArrayParameter$4(pairs, name, value, style, explode, allowReserved) {
    const values = value
        .filter((item) => item !== undefined && item !== null)
        .map((item) => serializePrimitive$4(item));
    if (values.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const item of values) {
            pairs.push(`${encodeQueryComponent$4(name)}=${encodeQueryValue$4(item, allowReserved)}`);
        }
        return;
    }
    pairs.push(`${encodeQueryComponent$4(name)}=${encodeQueryValue$4(values.join(','), allowReserved)}`);
}
function appendObjectParameter$4(pairs, name, value, style, explode, allowReserved) {
    const entries = Object.entries(value).filter(([, entryValue]) => entryValue !== undefined && entryValue !== null);
    if (entries.length === 0) {
        return;
    }
    if (style === 'form' && explode) {
        for (const [key, entryValue] of entries) {
            pairs.push(`${encodeQueryComponent$4(key)}=${encodeQueryValue$4(serializePrimitive$4(entryValue), allowReserved)}`);
        }
        return;
    }
    const serialized = entries.flatMap(([key, entryValue]) => [key, serializePrimitive$4(entryValue)]).join(',');
    pairs.push(`${encodeQueryComponent$4(name)}=${encodeQueryValue$4(serialized, allowReserved)}`);
}
function appendDeepObjectParameter$4(pairs, name, value, allowReserved) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        pairs.push(`${encodeQueryComponent$4(name)}=${encodeQueryValue$4(serializePrimitive$4(value), allowReserved)}`);
        return;
    }
    for (const [key, entryValue] of Object.entries(value)) {
        if (entryValue === undefined || entryValue === null) {
            continue;
        }
        pairs.push(`${encodeQueryComponent$4(`${name}[${key}]`)}=${encodeQueryValue$4(serializePrimitive$4(entryValue), allowReserved)}`);
    }
}
function serializePrimitive$4(value) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return String(value);
}
function encodeQueryComponent$4(value) {
    return encodeURIComponent(value);
}
function encodeQueryValue$4(value, allowReserved) {
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

class RtcProviderRoutesRtcProviderRoutesApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Routes list. */
    async list(params) {
        const query = buildQueryString$3([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$3(backendApiPath(`/rtc/provider_routes`), query));
    }
    /** Rtc provider Routes create. */
    async create(body) {
        return this.client.post(backendApiPath(`/rtc/provider_routes`), body, undefined, undefined, 'application/json');
    }
}
class RtcProviderRoutesRtcApi {
    constructor(client) {
        this.client = client;
        this.providerRoutes = new RtcProviderRoutesRtcProviderRoutesApi(client);
    }
}
class RtcProviderRoutesApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderRoutesRtcApi(client);
    }
}
function createRtcProviderRoutesApi(client) {
    return new RtcProviderRoutesApi(client);
}
function appendQueryString$3(path, rawQueryString) {
    const query = rawQueryString.replace(/^\?+/, '');
    if (!query) {
        return path;
    }
    return path.includes('?') ? `${path}&${query}` : `${path}?${query}`;
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

class RtcProviderWebhooksRtcProviderWebhooksEventsApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc provider Webhooks events receive. */
    async receive(provider, body) {
        return this.client.request(backendApiPath(`/rtc/provider_webhooks/${serializePathParameter$1(provider, { name: 'provider'})}/events`), { method: 'POST', body, contentType: 'application/json', skipAuth: true });
    }
    /** Rtc provider Webhooks events list. */
    async list(params) {
        const query = buildQueryString$2([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$2(backendApiPath(`/rtc/provider_webhooks/events`), query));
    }
}
class RtcProviderWebhooksRtcProviderWebhooksApi {
    constructor(client) {
        this.client = client;
        this.events = new RtcProviderWebhooksRtcProviderWebhooksEventsApi(client);
    }
}
class RtcProviderWebhooksRtcApi {
    constructor(client) {
        this.client = client;
        this.providerWebhooks = new RtcProviderWebhooksRtcProviderWebhooksApi(client);
    }
}
class RtcProviderWebhooksApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcProviderWebhooksRtcApi(client);
    }
}
function createRtcProviderWebhooksApi(client) {
    return new RtcProviderWebhooksApi(client);
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

class RtcQualitySamplesRtcQualitySamplesApi {
    constructor(client) {
        this.client = client;
    }
    /** Rtc quality Samples list. */
    async list(params) {
        const query = buildQueryString$1([
            { name: 'page', value: params?.page, style: 'form', explode: true, allowReserved: false },
            { name: 'page_size', value: params?.pageSize, style: 'form', explode: true, allowReserved: false },
            { name: 'cursor', value: params?.cursor, style: 'form', explode: true, allowReserved: false },
            { name: 'sort', value: params?.sort, style: 'form', explode: true, allowReserved: false },
            { name: 'q', value: params?.q, style: 'form', explode: true, allowReserved: false },
        ]);
        return this.client.get(appendQueryString$1(backendApiPath(`/rtc/quality_samples`), query));
    }
}
class RtcQualitySamplesRtcApi {
    constructor(client) {
        this.client = client;
        this.qualitySamples = new RtcQualitySamplesRtcQualitySamplesApi(client);
    }
}
class RtcQualitySamplesApi {
    constructor(client) {
        this.client = client;
        this.rtc = new RtcQualitySamplesRtcApi(client);
    }
}
function createRtcQualitySamplesApi(client) {
    return new RtcQualitySamplesApi(client);
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
        return this.client.get(appendQueryString(backendApiPath(`/rtc/rooms`), query));
    }
    /** Rtc rooms retrieve. */
    async retrieve(roomId) {
        return this.client.get(backendApiPath(`/rtc/rooms/${serializePathParameter(roomId, { name: 'roomId'})}`));
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

class SdkworkBackendClient {
    constructor(config) {
        this.httpClient = createHttpClient(config);
        this.rtcMediaArtifacts = createRtcMediaArtifactsApi(this.httpClient);
        this.rtcMediaSessions = createRtcMediaSessionsApi(this.httpClient);
        this.rtcProviderAccounts = createRtcProviderAccountsApi(this.httpClient);
        this.rtcProviderApplications = createRtcProviderApplicationsApi(this.httpClient);
        this.rtcProviderCredentials = createRtcProviderCredentialsApi(this.httpClient);
        this.rtcProviderProfiles = createRtcProviderProfilesApi(this.httpClient);
        this.rtcProviderQueryJobs = createRtcProviderQueryJobsApi(this.httpClient);
        this.rtcProviderRoutes = createRtcProviderRoutesApi(this.httpClient);
        this.rtcProviderWebhooks = createRtcProviderWebhooksApi(this.httpClient);
        this.rtcQualitySamples = createRtcQualitySamplesApi(this.httpClient);
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
    return new SdkworkBackendClient(config);
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
exports.RtcMediaArtifactsApi = RtcMediaArtifactsApi;
exports.RtcMediaSessionsApi = RtcMediaSessionsApi;
exports.RtcProviderAccountsApi = RtcProviderAccountsApi;
exports.RtcProviderApplicationsApi = RtcProviderApplicationsApi;
exports.RtcProviderCredentialsApi = RtcProviderCredentialsApi;
exports.RtcProviderProfilesApi = RtcProviderProfilesApi;
exports.RtcProviderQueryJobsApi = RtcProviderQueryJobsApi;
exports.RtcProviderRoutesApi = RtcProviderRoutesApi;
exports.RtcProviderWebhooksApi = RtcProviderWebhooksApi;
exports.RtcQualitySamplesApi = RtcQualitySamplesApi;
exports.RtcRoomsApi = RtcRoomsApi;
exports.SdkworkBackendClient = SdkworkBackendClient;
exports.backendApiPath = backendApiPath;
exports.createClient = createClient;
exports.createHttpClient = createHttpClient;
exports.createRtcMediaArtifactsApi = createRtcMediaArtifactsApi;
exports.createRtcMediaSessionsApi = createRtcMediaSessionsApi;
exports.createRtcProviderAccountsApi = createRtcProviderAccountsApi;
exports.createRtcProviderApplicationsApi = createRtcProviderApplicationsApi;
exports.createRtcProviderCredentialsApi = createRtcProviderCredentialsApi;
exports.createRtcProviderProfilesApi = createRtcProviderProfilesApi;
exports.createRtcProviderQueryJobsApi = createRtcProviderQueryJobsApi;
exports.createRtcProviderRoutesApi = createRtcProviderRoutesApi;
exports.createRtcProviderWebhooksApi = createRtcProviderWebhooksApi;
exports.createRtcQualitySamplesApi = createRtcQualitySamplesApi;
exports.createRtcRoomsApi = createRtcRoomsApi;
