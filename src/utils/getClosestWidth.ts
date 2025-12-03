export function getClosestWidth(width: number): number {
  if (width < 128) return 128;
  if (width >= 128 && width < 240) return 128;
  if (width >= 240 && width < 360) return 240;
  if (width >= 360 && width < 480) return 360;
  if (width >= 480 && width < 640) return 480;
  if (width >= 640 && width < 1280) return 640;
  if (width >= 1280 && width < 1600) return 1280;
  if (width >= 1600 && width < 1920) return 1600;
  if (width >= 1920 && width < 2560) return 1920;
  if (width >= 2560 && width < 3840) return 2560;
  if (width >= 3840 && width < 5210) return 3840;
  if (width >= 5210 && width < 7680) return 5210;
  if (width >= 7680) return 7680;

  return 1920;
}
