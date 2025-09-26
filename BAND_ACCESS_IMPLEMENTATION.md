# Band-Based Access Control Implementation

This document describes the implementation of band-based access control for the Oslyn app, replacing the previous global access model with a secure, scalable band-based system.

## 🎯 Overview

The new system allows users to:
- Create and join bands (shared workspaces)
- Access songs and setlists only from bands they belong to
- Import songs between bands
- Maintain O(1) performance for band lookups
- Scale to millions of users without performance degradation

## 🏗️ Architecture Changes

### New DynamoDB Tables

#### 1. UserBandMembershipTable
- **Purpose**: O(1) band membership lookups
- **Primary Key**: `userId` (PK), `bandId` (SK)
- **GSI**: `bandId-index` for reverse lookups
- **Fields**: `userId`, `bandId`, `role`, `joinedAt`

#### 2. BandSongTable
- **Purpose**: Denormalized song access for performance
- **Primary Key**: `bandId` (PK), `songId` (SK)
- **GSI**: `songId-index` for song-to-band lookups
- **Fields**: `bandId`, `songId`, `addedBy`, `addedAt`

#### 3. BandSetlistTable
- **Purpose**: Denormalized setlist access for performance
- **Primary Key**: `bandId` (PK), `setlistId` (SK)
- **GSI**: `setlistId-index` for setlist-to-band lookups
- **Fields**: `bandId`, `setlistId`, `createdBy`, `createdAt`

### Modified Existing Tables

#### SongTable
- **Added**: `createdBy`, `bandId`, `bandIds[]`
- **Kept**: `userId` for backward compatibility

#### SetlistTable
- **Added**: `createdBy`, `bandId`
- **Kept**: `userId` for backward compatibility

## 🚀 Performance Characteristics

### O(1) Operations
- Get user's bands: `Query userId = :userId`
- Check band access: `Query userId = :userId AND bandId = :bandId`

### O(n) Operations (where n = user's band count)
- Get accessible songs: Query each band's songs
- Check song access: Check if song exists in any user's band

## 🔒 Security Implementation

### Access Control Flow
1. User requests songs/setlists
2. Server gets user's bands (O(1))
3. Server gets songs from each band (O(n))
4. Server filters and returns accessible data

### Data Exposure
- **Band IDs**: Safe to expose (needed for navigation)
- **User IDs**: Never exposed in client responses
- **Access Control**: Server-side validation ensures users only see their band's data

## 📊 GraphQL Schema Updates

### New Query Parameters
```graphql
# Before
listSongs(userId: ID!): [Song]!

# After
listSongs(userId: ID!, bandId: ID): [Song]!
```

### New Mutations
```graphql
# Band management
addUserToBand(bandId: ID!, userId: ID!, role: bandRole!): UserBandRole
removeUserFromBand(bandId: ID!, userId: ID!): Band
updateUserBandRole(bandId: ID!, userId: ID!, role: bandRole!): UserBandRole

# Song import
importSongToBand(songId: ID!, fromBandId: ID!, toBandId: ID!, userId: ID!): Song
importSetlistToBand(setlistId: ID!, fromBandId: ID!, toBandId: ID!, userId: ID!): SetList
```

### Updated Types
```graphql
type Song {
  # ... existing fields ...
  bandIds: [ID]!  # All bands this song belongs to
  primaryBandId: ID  # Primary band (for display purposes)
}

type SetList {
  # ... existing fields ...
  bandId: ID!  # Primary band this setlist belongs to
}
```

## 🛠️ Implementation Files

### New Files Created
- `aws/lambdas/util/bandAccessControl.ts` - Utility functions for band access
- `aws/lambdas/appsync/band/addUserToBand.ts` - Add user to band
- `aws/lambdas/appsync/band/removeUserFromBand.ts` - Remove user from band
- `aws/lambdas/appsync/song/importSongToBand.ts` - Import song between bands
- `aws/scripts/migrate-to-band-access.ts` - Migration script
- `aws/scripts/deploy-band-access.sh` - Deployment script

### Modified Files
- `aws/stacks/dynamo-stack.ts` - Added new tables
- `aws/schema.graphql` - Updated schema with band context
- `aws/lambdas/appsync/song/createSong.ts` - Added band context
- `aws/lambdas/appsync/song/listSongs.ts` - Band-based access control
- `aws/lambdas/appsync/setList/createSet.ts` - Added band context

## 🚀 Deployment Instructions

### 1. Deploy New Tables
```bash
cd aws
npm run deploy
```

### 2. Run Migration
```bash
cd aws/scripts
npx ts-node migrate-to-band-access.ts
```

### 3. Deploy Updated Resolvers
```bash
cd aws
npm run deploy
```

### Or use the automated script:
```bash
./aws/scripts/deploy-band-access.sh
```

## 📋 Migration Process

The migration script:
1. Creates a default band for each existing user
2. Migrates all user's songs to their default band
3. Migrates all user's setlists to their default band
4. Populates the new denormalized tables
5. Updates existing records with band associations

## 🎵 Song Import Feature

Users can easily import songs between bands:

```typescript
// Import song from one band to another
const importedSong = await importSongToBand({
  songId: "song-123",
  fromBandId: "band-1",
  toBandId: "band-2",
  userId: "user-456"
})
```

## 🔍 Usage Examples

### Get User's Songs from All Bands
```graphql
query {
  listSongs(userId: "user-123") {
    songId
    title
    artist
    bandIds
    primaryBandId
  }
}
```

### Get Songs from Specific Band
```graphql
query {
  listSongs(userId: "user-123", bandId: "band-456") {
    songId
    title
    artist
  }
}
```

### Create Song in Band
```graphql
mutation {
  createSong(
    title: "My Song"
    userId: "user-123"
    bandId: "band-456"
    chordSheet: "C G Am F"
    chordSheetKey: "C"
  ) {
    songId
    title
    bandIds
  }
}
```

### Import Song Between Bands
```graphql
mutation {
  importSongToBand(
    songId: "song-123"
    fromBandId: "band-1"
    toBandId: "band-2"
    userId: "user-456"
  ) {
    songId
    title
    bandIds
  }
}
```

## 🎯 Benefits

### Security
- Users only see songs/setlists from bands they belong to
- No user IDs exposed in client responses
- Server-side access control validation

### Performance
- O(1) band lookups for users
- O(n) song access checks (where n = user's band count)
- Heavy work moved to mutation time (adding songs to bands)

### Scalability
- Supports millions of users and bands
- DynamoDB handles billions of items efficiently
- Automatic partitioning across multiple servers

### User Experience
- Easy song import between bands
- Band-based organization
- Maintains existing GraphQL API compatibility

## 🔧 Maintenance

### Adding New Band Members
```typescript
await addUserToBand(dynamo, bandId, userId, 'MEMBER')
```

### Removing Band Members
```typescript
await removeUserFromBand(dynamo, bandId, userId)
```

### Checking Access
```typescript
const hasAccess = await hasBandAccess(dynamo, userId, bandId)
const hasSongAccess = await hasSongAccess(dynamo, userId, songId)
```

## 📈 Monitoring

Monitor these metrics:
- Band membership table size
- Song access query performance
- Band creation rate
- Song import frequency

## 🚨 Rollback Plan

If issues arise:
1. Revert GraphQL schema changes
2. Update resolvers to use old access pattern
3. Keep new tables for future use
4. Data remains intact in both old and new structures

## 🎉 Conclusion

The band-based access control system provides:
- **Security**: Proper access control without exposing sensitive data
- **Performance**: O(1) band lookups, O(n) song access checks
- **Scalability**: Supports millions of users and bands
- **User Experience**: Easy song import and band management
- **Compatibility**: Maintains existing GraphQL API structure

The implementation is production-ready and can be deployed incrementally without breaking existing functionality.
