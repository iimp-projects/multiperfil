import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Downloads an image (data URL) on web/android, or triggers a native share dialog on iOS.
 * 
 * @param imageDataUrl The image data URL (e.g. data:image/png;base64,...)
 * @param fileName The name of the file to be saved/shared (e.g. "qr-code.png")
 */
export async function downloadOrShareImage(imageDataUrl: string, fileName: string) {
  // Check if we are in a native platform AND it's iOS
  // Capacitor.isNativePlatform() ensures we don't try to use native APIs in a browser
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios') {
    try {
      const base64Data = imageDataUrl.split(',')[1];

      // Save file to Cache directory so it can be shared
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Trigger native share dialog
      await Share.share({
        title: fileName,
        text: 'Compartir imagen',
        url: savedFile.uri,
        dialogTitle: 'Compartir imagen',
      });
    } catch (error) {
      console.error('Error sharing image on iOS:', error);
      // Fallback in case of error (though might still fail in WebView)
      const link = document.createElement('a');
      link.href = imageDataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    return;
  }

  // Standard Web / Android fallback
  const link = document.createElement('a');
  link.href = imageDataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
