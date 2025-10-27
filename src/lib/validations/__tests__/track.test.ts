import {
  createTrackSchema,
  updateTrackSchema,
  listTracksSchema,
  trackLikeSchema,
} from '../track';

describe('Track Validation Schemas', () => {
  describe('createTrackSchema', () => {
    it('should validate correct track data', () => {
      const validData = {
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        isExplicit: false,
        isPublished: true,
      };

      const result = createTrackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid IPFS hash', () => {
      const invalidData = {
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'invalid-hash',
      };

      const result = createTrackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative duration', () => {
      const invalidData = {
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: -10,
        ipfsHash: 'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      };

      const result = createTrackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should set default values', () => {
      const data = {
        title: 'Test Track',
        artistName: 'Test Artist',
        genre: 'Electronic',
        duration: 180,
        ipfsHash: 'QmXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      };

      const result = createTrackSchema.parse(data);
      expect(result.isExplicit).toBe(false);
      expect(result.isPublished).toBe(false);
    });
  });

  describe('updateTrackSchema', () => {
    it('should allow partial updates', () => {
      const validData = {
        id: 'clx1234567890',
        title: 'Updated Title',
      };

      const result = updateTrackSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should require id', () => {
      const invalidData = {
        title: 'Updated Title',
      };

      const result = updateTrackSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('listTracksSchema', () => {
    it('should validate pagination parameters', () => {
      const validData = {
        page: '1',
        limit: '20',
        sortBy: 'playCount',
        sortOrder: 'desc',
      };

      const result = listTracksSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should set default values', () => {
      const result = listTracksSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe('desc');
    });

    it('should reject invalid limit', () => {
      const invalidData = {
        limit: '200', // Max is 100
      };

      const result = listTracksSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('trackLikeSchema', () => {
    it('should validate track like', () => {
      const validData = {
        trackId: 'clx1234567890',
      };

      const result = trackLikeSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject missing trackId', () => {
      const result = trackLikeSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});