# 📦 Service Worker Caching Strategy

This document explains the comprehensive caching strategies implemented for offline gameplay and faster load times.

## 🎯 Caching Strategies Overview

### 1. **API Cache (NetworkFirst)**
- **Pattern**: `/^https:\/\/.*\.supabase\.co\/rest\/.*/i`
- **Strategy**: NetworkFirst with 10s timeout
- **Expiry**: 5 minutes
- **Max Entries**: 100

Prioritizes fresh data but falls back to cache if network fails or is slow. Perfect for game data that needs to be current but should work offline.

### 2. **Auth Requests (NetworkOnly)**
- **Pattern**: `/^https:\/\/.*\.supabase\.co\/auth\/.*/i`
- **Strategy**: NetworkOnly (never cached)

Authentication requests are never cached for security.

### 3. **Storage Assets (CacheFirst)**
- **Pattern**: `/^https:\/\/.*\.supabase\.co\/storage\/.*/i`
- **Strategy**: CacheFirst
- **Expiry**: 30 days
- **Max Entries**: 100

Images and assets from Supabase Storage are cached aggressively since they rarely change.

### 4. **Avatars (CacheFirst)**
- **Pattern**: `/^https:\/\/api\.dicebear\.com\/.*/i`
- **Strategy**: CacheFirst
- **Expiry**: 7 days
- **Max Entries**: 50

User avatars are cached for a week to reduce API calls.

### 5. **Google Fonts (CacheFirst)**
- **Stylesheets**: 1 year cache
- **Webfonts**: 1 year cache
- **Max Entries**: 20 each

Fonts are cached for maximum performance since they never change.

### 6. **Images (CacheFirst)**
- **Pattern**: `\.(?:png|jpg|jpeg|svg|gif|webp)$/i`
- **Strategy**: CacheFirst
- **Expiry**: 30 days
- **Max Entries**: 100

All images are cached aggressively for fast loads.

### 7. **JavaScript & CSS (StaleWhileRevalidate)**
- **Pattern**: `\.(?:js|css)$/i`
- **Strategy**: StaleWhileRevalidate
- **Expiry**: 1 day
- **Max Entries**: 60

Returns cached version immediately while fetching fresh version in background.

## 🔧 Cache Management Utilities

### Available Functions

```typescript
// Get cache statistics
const stats = await getCacheStats();

// Clear all caches
await clearAllCaches();

// Clear specific cache pattern
await clearCacheByPattern('api');

// Check online/offline status
const offline = isOffline();

// Get storage quota info
const storage = await getStorageInfo();

// Format bytes
const readable = formatBytes(12345678); // "11.77 MB"
```

## 📱 User Interface

### Offline Indicator
Automatically appears when the user goes offline, showing "Offline Mode" badge at bottom-left.

### Cache Manager
Available in Profile → Storage tab:
- View cache breakdown by type
- See total storage usage
- Clear all caches with confirmation
- Refresh statistics

### PWA Install Prompt
Non-intrusive prompt appears for installable PWAs:
- Can be dismissed (remembers choice)
- Shows install benefits
- One-click installation

## 🚀 Performance Benefits

1. **Instant Load Times**: Cached resources load instantly
2. **Offline Gameplay**: Core features work without internet
3. **Reduced Data Usage**: Less network requests = lower data consumption
4. **Better Mobile Experience**: Especially on slow/unstable connections
5. **Background Sync**: Changes sync automatically when online

## 📊 Cache Size Expectations

Typical cache sizes:
- **API Cache**: 1-5 MB (game data, players, hands)
- **Storage Assets**: 2-10 MB (card images, UI assets)
- **Avatars**: 500 KB - 2 MB
- **Static Assets**: 1-3 MB (JS, CSS, fonts)
- **Total**: 5-20 MB typical usage

## 🔄 Auto-Cleanup

- Old caches are automatically cleaned up
- Maximum file size: 5 MB per asset
- Caches expire based on strategy
- LRU (Least Recently Used) eviction when limits reached

## 🛠️ Development

### Testing Offline Mode

1. Open DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Refresh the page
4. Test functionality

### Viewing Cache

1. DevTools → Application → Cache Storage
2. Expand to see all caches
3. Inspect individual cached resources

### Force Update

Users can force clear cache from Profile → Storage → Clear All Cache button.

## 📝 Best Practices

1. **Critical Data**: Always use NetworkFirst for real-time data
2. **Static Assets**: Use CacheFirst for images, fonts
3. **Security**: Never cache sensitive auth data
4. **Expiration**: Set appropriate expiry times
5. **Size Limits**: Keep individual assets under 5MB
6. **User Control**: Allow users to clear cache manually

## 🐛 Troubleshooting

**Problem**: Seeing old data
- **Solution**: Clear cache from Profile → Storage or hard refresh (Ctrl+Shift+R)

**Problem**: Cache not working
- **Solution**: Check if service worker is active in DevTools → Application

**Problem**: Storage quota exceeded
- **Solution**: Clear old caches, reduce max entries

## 🔮 Future Enhancements

- Background sync for offline changes
- Selective cache prefetching
- Compression for cached data
- IndexedDB for structured game data
- Cache versioning and migration
