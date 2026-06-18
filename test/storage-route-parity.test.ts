import { strict as assert } from 'assert'
import { test } from 'node:test'
import { createClient } from '../src/client.ts'
import { storageSdkManifest } from '../src/storage/module.ts'

function createMockResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

test('storageSdkManifest covers the current storage OpenAPI route matrix', () => {
  const expectedRoutes = [
    'GET /storage/catalogs',
    'POST /storage/catalogs',
    'PATCH /storage/catalogs/{id}',
    'DELETE /storage/catalogs/{id}',
    'GET /storage/credentials',
    'POST /storage/files/upload-url',
    'POST /storage/files/upload-urls',
    'POST /storage/files/list',
    'POST /storage/files/search',
    'POST /storage/files/delete-many',
    'POST /storage/files/update-many',
    'POST /storage/files/visibility-many',
    'GET /storage/files/{file_id}',
    'PATCH /storage/files/{file_id}',
    'DELETE /storage/files/{file_id}',
    'GET /storage/files/{file_id}/url',
    'GET /storage/files/{file_id}/proxy',
    'POST /storage/files/{file_id}/confirm-upload',
    'PUT /storage/files/{file_id}/upload',
    'POST /storage/files/{file_id}/copy',
    'POST /storage/files/{file_id}/restore',
    'DELETE /storage/files/{file_id}/purge',
    'GET /storage/files/{file_id}/public-url',
    'GET /storage/files/{file_id}/versions',
    'POST /storage/files/{file_id}/versions/{version_id}/restore',
    'DELETE /storage/files/{file_id}/versions/{version_id}',
    'POST /storage/files/{file_id}/retention',
    'PATCH /storage/files/{file_id}/visibility',
    'POST /storage/files/{file_id}/visibility',
    'POST /storage/folders/list',
    'POST /storage/folders/tree',
    'POST /storage/folders/delete',
    'POST /storage/permissions/list',
    'POST /storage/permissions/grant',
    'POST /storage/permissions/revoke',
    'POST /storage/permissions/check',
    'POST /storage/objects',
    'POST /storage/objects/head',
    'POST /storage/objects/update',
    'POST /storage/objects/url',
    'POST /storage/objects/delete',
    'POST /storage/objects/folder',
    'POST /storage/objects/folder/delete',
    'POST /storage/objects/folder/rename',
    'POST /storage/objects/upload-url',
    'POST /storage/objects/exists',
    'POST /storage/objects/validate',
    'POST /storage/objects/public-url',
    'POST /storage/objects/copy',
    'POST /storage/objects/versions',
    'POST /storage/objects/versions/restore',
    'POST /storage/objects/versions/delete',
    'POST /storage/buckets/list',
    'POST /storage/buckets/create',
    'POST /storage/buckets/delete',
    'POST /storage/buckets/cors',
    'POST /storage/buckets/cors/set',
    'POST /storage/buckets/cors/delete',
    'POST /storage/buckets/lifecycle',
    'POST /storage/buckets/lifecycle/set',
    'POST /storage/multipart/create',
    'POST /storage/multipart/sign-part',
    'POST /storage/multipart/complete',
    'POST /storage/multipart/abort',
    'POST /storage/multipart/list-parts',
    'POST /storage/audit/list',
  ]

  const manifestRoutes = new Set(
    storageSdkManifest.methods.map(({ method, path }) => `${method} ${path}`),
  )
  const missingRoutes = expectedRoutes.filter((route) => !manifestRoutes.has(route))

  assert.deepEqual(missingRoutes, [])
})

test('storage visibility helpers route PATCH, POST, and bulk POST correctly', async () => {
  const originalFetch = globalThis.fetch
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const file = {
    id: 'file_1',
    name: 'report.pdf',
    bucket: 'documents',
    organization_id: 'org_1',
    metadata: {},
    created_at: '2026-06-18T00:00:00Z',
    updated_at: '2026-06-18T00:00:00Z',
    storage_key: 'reports/report.pdf',
    is_public: true,
    status: 'ready',
  }

  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init })
    const parsedUrl = new URL(String(url))

    if (parsedUrl.pathname === '/storage/files/visibility-many') {
      return createMockResponse({
        status: 'success',
        message: 'ok',
        data: {
          files: [file],
          count: 1,
        },
      })
    }

    if (parsedUrl.pathname === '/storage/files/file_1/visibility') {
      return createMockResponse({
        status: 'success',
        message: 'ok',
        data: {
          file,
        },
      })
    }

    return createMockResponse({ error: `unexpected ${init?.method} ${parsedUrl.pathname}` }, 404)
  }

  try {
    const client = createClient('https://athena-db.com', 'secret', {
      client: 'storage_visibility',
      experimental: { athenaStorageBackend: true },
    })

    await client.storage.setStorageFileVisibility('file_1', { public: true })
    await client.storage.file.visibility.update('file_1', { visibility: 'organization' })
    await client.storage.file.visibility.set('file_1', { public: false })
    await client.storage.file.visibility.setMany({
      file_ids: ['file_1'],
      visibility: 'public',
    })

    const observed = calls.map((call) => {
      const parsedUrl = new URL(call.url)
      return {
        method: call.init?.method,
        path: parsedUrl.pathname,
        body: call.init?.body ? JSON.parse(call.init.body as string) : undefined,
        client: call.init?.headers instanceof Headers
          ? call.init.headers.get('X-Athena-Client')
          : (call.init?.headers as Record<string, string> | undefined)?.['X-Athena-Client'],
      }
    })

    assert.deepEqual(observed, [
      {
        method: 'PATCH',
        path: '/storage/files/file_1/visibility',
        body: { public: true },
        client: 'storage_visibility',
      },
      {
        method: 'PATCH',
        path: '/storage/files/file_1/visibility',
        body: { visibility: 'organization' },
        client: 'storage_visibility',
      },
      {
        method: 'POST',
        path: '/storage/files/file_1/visibility',
        body: { public: false },
        client: 'storage_visibility',
      },
      {
        method: 'POST',
        path: '/storage/files/visibility-many',
        body: { file_ids: ['file_1'], visibility: 'public' },
        client: 'storage_visibility',
      },
    ])
  } finally {
    globalThis.fetch = originalFetch
  }
})
