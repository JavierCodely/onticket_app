-- =====================================================
-- Storage: Policies Configuration
-- Description: RLS policies for storage buckets
-- =====================================================

-- =====================================================
-- PRODUCTOS IMAGES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to view images from their club
CREATE POLICY "Users can view club product images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'productos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Only admins can upload product images to their club folder
CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'productos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can update product images from their club
CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'productos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can delete product images from their club
CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'productos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- =====================================================
-- PROMOCIONES IMAGES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to view promotion images from their club
CREATE POLICY "Users can view club promotion images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'promociones-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Only admins can upload promotion images to their club folder
CREATE POLICY "Admins can upload promotion images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'promociones-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can update promotion images from their club
CREATE POLICY "Admins can update promotion images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'promociones-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can delete promotion images from their club
CREATE POLICY "Admins can delete promotion images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'promociones-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- =====================================================
-- COMBOS IMAGES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to view combo images from their club
CREATE POLICY "Users can view club combo images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'combos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
);

-- Only admins can upload combo images to their club folder
CREATE POLICY "Admins can upload combo images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'combos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can update combo images from their club
CREATE POLICY "Admins can update combo images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'combos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);

-- Only admins can delete combo images from their club
CREATE POLICY "Admins can delete combo images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'combos-images'
    AND (storage.foldername(name))[1] = (
        SELECT club_id::text
        FROM personal
        WHERE user_id = auth.uid()
        LIMIT 1
    )
    AND (
        SELECT rol FROM personal WHERE user_id = auth.uid() LIMIT 1
    ) = 'Admin'
);
