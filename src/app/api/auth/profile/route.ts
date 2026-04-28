import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Profile as ProfileModel } from '@/lib/models';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await connectToDatabase();
    const profile = await ProfileModel.findById(userId);

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Map _id to id
    const profileData = {
      id: profile._id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      status: profile.status
    };

    return NextResponse.json(profileData);
  } catch (err: any) {
    console.error('Error fetching profile from MongoDB:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
