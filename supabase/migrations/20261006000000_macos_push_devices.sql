ALTER TABLE public.push_devices
  DROP CONSTRAINT IF EXISTS push_devices_platform_check;

ALTER TABLE public.push_devices
  ADD CONSTRAINT push_devices_platform_check
  CHECK (platform IN ('ios', 'macos'));