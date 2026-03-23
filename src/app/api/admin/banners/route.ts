import { NextResponse } from 'next/server';
import { adminAuth, adminStorage, adminFirestore } from '@/firebase/admin';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const SUPER_ADMIN_UID = '6BXkgq9KkCY8ZPBvSbMV6m5OuAV2';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { uid } = decodedToken;
    let isAdmin = uid === SUPER_ADMIN_UID;

    if (!isAdmin) {
      const adminDoc = await adminFirestore.collection('adminUsers').doc(uid).get();
      isAdmin = adminDoc.exists;
    }

    if (!isAdmin) {
      return NextResponse.json({ error: 'Access denied: Requires Admin' }, { status: 403 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File | null;
    const linkUrl = formData.get('linkUrl') as string | null;
    const altText = formData.get('altText') as string | null;
    const isActiveStr = formData.get('isActive') as string | null;

    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const isActive = isActiveStr === 'true';

    // Upload image to Firebase Storage
    const buffer = Buffer.from(await image.arrayBuffer());
    const fileId = uuidv4();
    const extension = image.name.split('.').pop() || 'png';
    const filePath = `banners/${fileId}.${extension}`;
    
    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);
    
    await file.save(buffer, {
      metadata: {
        contentType: image.type,
      },
      public: true,
    });
    
    // Instead of using publicUrl, we use the standard firebase storage URL format using bucket token or just construct it:
    // With Firebase Storage, one way to get a public URL for a file that isn't publicly readable natively is via the token,
    // but if the bucket has public read on /banners, we can construct:
    // https://storage.googleapis.com/BUCKET_NAME/banners/...
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    // Save to Firestore 'banners' collection
    const metadata = {
      id: fileId,
      imageUrl,
      linkUrl: linkUrl || '',
      altText: altText || '',
      isActive: isActive,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid
    };

    await adminFirestore.collection('banners').doc(fileId).set(metadata);

    // Also note: The user asked to create a Data Connect schema which was done, but since the frontend 
    // uses Firestore primarily, we save it to Firestore here.

    return NextResponse.json({ success: true, banner: metadata });
  } catch (error: any) {
    console.error('Error uploading banner:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
