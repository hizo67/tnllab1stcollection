# The 1st Collection — WebAR

WebAR image tracking poster A2 with silent looping 4:5 animation and camera+AR recording.

## Ready to deploy — target already included

The supplied compiled marker has been installed at `assets/targets.mind`. No marker compilation is needed.

## GitHub Pages

Create a public GitHub repository, upload `index.html`, `style.css`, `app.js`, and the `assets` folder including `targets.mind`. In **Settings → Pages**, select **Deploy from a branch**, `main`, `/ (root)`. Open the HTTPS URL on a phone and allow camera access.

## Asset processing

- Poster: 1448×2048 px, portrait A2 ratio.
- Animation: original 1600×2000 px, 30 fps, 15.7 seconds; optimized MP4 is included at 800×1000 px.
- AR display uses **scale-to-fill**: original video ratio is preserved, and the A2 AR plane acts as the visible viewport. The original video file is not cropped.

## Notes / limitations

- Browser recording is experimental on iOS/Android. Format and saving behavior differ; verify on actual devices.
- `canvas.captureStream` + `MediaRecorder` may not be supported consistently on all iPhones. This prototype includes a user-facing fallback error.
- The recording compositor draws camera video and the WebGL canvas together. Exact crop/rotation alignment should be verified on each device/browser, especially Safari.
- When target tracking is lost, video is paused and the plane is hidden by MindAR. It resumes at the same playback time when found again.
- Camera preview is only available in a secure context (HTTPS/localhost).
- Performance and target tracking stability depend on lighting, reflections, distance and mobile GPU.
- CDN dependencies require internet connectivity.

## Next steps for production

1. Test the supplied `targets.mind` against the physical poster.
2. Validate recorded output on iPhone Safari and Android Chrome. If compositing alignment is off, adjust the camera crop to match MindAR's actual video display transform.
3. Add an optional server-side MP4 conversion flow if seamless iOS download is mandatory.

## Important

This is a working-code prototype, not a verified production AR experience. The MindAR marker binary is supplied by the user and has not been validated against the physical poster here. iOS Safari recording compatibility and canvas/camera compositing must be tested on a real phone.
