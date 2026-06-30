-- 0024 SECURITY FIX: lock down the internal book_guest() function.
--
-- 0021 granted book_guest(p_member,...) to authenticated and only revoked anon
-- (which is a no-op: the default CREATE FUNCTION grant to PUBLIC remained). The
-- function is SECURITY DEFINER and takes an arbitrary p_member with no check
-- that it matches the caller — so any authenticated (or anonymous, via PUBLIC)
-- caller could charge ANY member a credit and create guest bookings in their
-- name. Only the SECURITY DEFINER wrapper book_guest_self (which resolves the
-- caller via auth.uid()) should reach it.
--
-- book_guest_self runs as its owner (postgres), who retains EXECUTE, so the
-- legitimate path keeps working after these revokes.

revoke execute on function public.book_guest(uuid, uuid, text, text, booking_source) from public;
revoke execute on function public.book_guest(uuid, uuid, text, text, booking_source) from anon;
revoke execute on function public.book_guest(uuid, uuid, text, text, booking_source) from authenticated;

notify pgrst, 'reload schema';
