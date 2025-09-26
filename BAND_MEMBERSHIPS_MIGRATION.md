# Band Memberships Schema Migration

## Overview

This migration moves band membership data from a separate `UserBandMembershipTable` to a `bandMemberships` field directly on the `User` record. This change significantly improves performance for the Bands tab in the Flutter app.

## Problem Solved

**Before**: The Bands tab required multiple DynamoDB queries:
1. Query `UserBandMembershipTable` to get user's band memberships
2. Batch fetch each band's details from `BAND_TABLE`
3. Query `UserBandMembershipTable` again to get members for each band

**After**: The Bands tab requires only:
1. Single query to get user with `bandMemberships` field
2. Batch fetch band details (same as before)

## Schema Changes

### GraphQL Schema (`aws/schema.graphql`)

```graphql
# New type for band memberships
type BandMembership {
  bandId: ID!
  role: bandRole!
  joinedAt: AWSTimestamp!
}

# Updated User type
type User {
  # ... existing fields ...
  bandIds: [ID] # Deprecated - kept for backward compatibility
  bandMemberships: [BandMembership] # New field with full membership info
}
```

### DynamoDB Changes

- **No new tables required**
- **No changes to existing table structure**
- User records now include `bandMemberships` field with list of membership objects

## Code Changes

### 1. AWS Lambda (`aws/lambdas/appsync/band/listBands.ts`)

- **Removed**: Query to `UserBandMembershipTable`
- **Added**: Direct access to user's `bandMemberships` field
- **Backward compatibility**: Falls back to `bandIds` if `bandMemberships` not available

### 2. Flutter App (`oslyn_flutter_app/lib/models/jam_session.dart`)

- **Added**: `BandMembership` class with JSON serialization
- **Updated**: `User` class to include `bandMemberships` field

### 3. Flutter UI (`oslyn_flutter_app/lib/widgets/user_account_interface.dart`)

- **Updated**: Band categorization logic to use `bandMemberships` field
- **Improved**: Role detection using membership data instead of band ownership

## Migration Process

### 1. Deploy Schema Changes
```bash
cd aws
npm run deploy
```

### 2. Run Migration Script
```bash
cd aws/scripts
npm run build
node dist/migrate-band-memberships.js
```

### 3. Test Implementation
```bash
node dist/test-band-memberships.js
```

### 4. Deploy Everything
```bash
./aws/scripts/deploy-band-memberships.sh
```

## Performance Benefits

1. **Reduced DynamoDB Queries**: From 3+ queries to 1 query for user data
2. **Lower Latency**: Single round-trip to get all membership data
3. **Reduced Costs**: Fewer DynamoDB read operations
4. **Simpler Logic**: No need to query separate membership table

## Backward Compatibility

- Old `bandIds` field is preserved and used as fallback
- Migration script handles existing data
- Lambda function works with both old and new schemas

## Testing

The migration includes:
- **Migration script**: Moves data from old table to new field
- **Test script**: Verifies data migration worked correctly
- **Backward compatibility**: Ensures old data still works

## Rollback Plan

If issues arise:
1. The old `UserBandMembershipTable` is preserved
2. Lambda function falls back to old logic if `bandMemberships` is empty
3. Can revert by removing `bandMemberships` field and using old table

## Future Considerations

1. **GSI for Members Query**: Consider adding GSI on `bandMemberships.bandId` for efficient "all users in band X" queries
2. **Cleanup**: Remove `UserBandMembershipTable` after confirming everything works
3. **Monitoring**: Track performance improvements and user experience

## Files Modified

- `aws/schema.graphql` - Added BandMembership type and updated User type
- `aws/lambdas/appsync/band/listBands.ts` - Updated to use new schema
- `oslyn_flutter_app/lib/models/jam_session.dart` - Added BandMembership class
- `oslyn_flutter_app/lib/widgets/user_account_interface.dart` - Updated UI logic
- `aws/scripts/migrate-band-memberships.ts` - Migration script
- `aws/scripts/test-band-memberships.ts` - Test script
- `aws/scripts/deploy-band-memberships.sh` - Deployment script
