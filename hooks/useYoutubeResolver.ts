import { useCallback } from 'react';

export function useYoutubeResolver() {
  const resolveAudioUrl = useCallback(async (videoId: string): Promise<string | null> => {
    try {
      const response = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip'
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'ANDROID',
              clientVersion: '19.09.37',
              androidSdkVersion: 30
            }
          },
          videoId: videoId
        })
      });

      if (!response.ok) {
        throw new Error(`InnerTube API failed with status ${response.status}`);
      }

      const data = await response.json();
      
      const formats = data?.streamingData?.adaptiveFormats || [];
      if (formats.length === 0) {
        return null;
      }

      // Filter for audio formats (prefer mp4/m4a, fallback to webm)
      const audioFormats = formats.filter(
        (f: any) => f.mimeType?.includes('audio/')
      );

      if (audioFormats.length === 0) {
        return null;
      }

      // Sort by bitrate descending (highest first)
      audioFormats.sort((a: any, b: any) => (b.averageBitrate || b.bitrate || 0) - (a.averageBitrate || a.bitrate || 0));

      return audioFormats[0].url;
    } catch (error) {
      console.error('Error resolving YouTube audio via InnerTube:', error);
      return null;
    }
  }, []);

  return { resolveAudioUrl };
}
