import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import imageCompression from 'browser-image-compression'
import { compressPhoto } from '../imageCompression'

vi.mock('browser-image-compression', () => ({ default: vi.fn() }))

const compressionMock = vi.mocked(imageCompression)

describe('compressPhoto adatvédelmi kapu', () => {
  beforeEach(() => {
    compressionMock.mockReset()
  })

  afterEach(() => vi.restoreAllMocks())

  it('csak a sikeresen újrakódolt fájlt adja tovább', async () => {
    const original = new File(['eredeti'], 'esemeny.png', { type: 'image/png' })
    const sanitized = new File(['ujrakodolt'], 'esemeny.jpg', { type: 'image/jpeg' })
    compressionMock.mockResolvedValue(sanitized)

    await expect(compressPhoto(original)).resolves.toBe(sanitized)
    expect(compressionMock).toHaveBeenCalledWith(original, expect.objectContaining({
      maxWidthOrHeight: 800,
      fileType: 'image/jpeg',
    }))
  })

  it('újrakódolási hibánál fail-closed elutasítja az eredeti fájl feltöltését', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const original = new File(['exif-adat'], 'esemeny.jpg', { type: 'image/jpeg' })
    compressionMock.mockRejectedValue(new Error('decoder failure'))

    await expect(compressPhoto(original)).rejects.toThrow(
      'A fénykép biztonságos előkészítése nem sikerült.',
    )
  })
})
