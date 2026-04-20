import React, { useState, useRef, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Calendar,
  Camera,
  Check
} from 'lucide-react';
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../firebase/firestore';
import { fileToBase64 } from '../utils/base64Converter';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, role, profile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [photoBase64, setPhotoBase64] = useState('');
  const [updating, setUpdating] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize from profile when loaded
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || user?.email?.split('@')[0]);
      setPhotoBase64(profile.photoBase64 || '');
    }
  }, [profile, user]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file, { maxWidth: 400, maxHeight: 400, quality: 0.6 });
      setPhotoBase64(base64);
      toast.success("Image selected! Don't forget to save profile.");
    } catch (err) {
      console.error(err);
      toast.error("Error processing image");
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await updateUserProfile(user.uid, { 
        name: displayName,
        photoBase64: photoBase64 
      });
      toast.success("Profile updated! Your new avatar is active.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-screen overflow-y-auto custom-scrollbar">
       <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/20">
          <UserIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your Profile</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your account and credentials.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center">
            <div className="relative group mb-6">
              <div className="h-32 w-32 bg-slate-100 rounded-full flex items-center justify-center border-4 border-indigo-50 overflow-hidden shadow-inner">
                {photoBase64 ? (
                  <img src={photoBase64} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserIcon className="h-16 w-16 text-slate-300" />
                )}
              </div>
              <input 
                type="file" 
                hidden 
                ref={fileInputRef} 
                accept="image/*" 
                onChange={handleImageChange}
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-600/30 hover:scale-110 transition-all active:scale-95 z-10"
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>
            
            <h3 className="text-2xl font-black text-slate-900 mb-1">{displayName}</h3>
            <p className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{role}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-500">
                <Mail className="h-5 w-5" />
                <span className="text-sm font-medium">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">Access: {role === 'admin' ? 'Total control' : 'Sales and Orders'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-500">
                <Calendar className="h-5 w-5" />
                <span className="text-sm font-medium">Joined April 2026</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
                <h3 className="text-xl font-bold text-slate-900 mb-8 pb-4 border-b border-slate-50">Account Details</h3>
                
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Display Name</label>
                        <input 
                            type="text" 
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 transition-all outline-none font-bold text-slate-700"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Email Address</label>
                        <input 
                            type="email" 
                            readOnly
                            disabled
                            className="w-full px-5 py-4 bg-slate-100 border border-transparent rounded-2xl outline-none font-bold text-slate-500 cursor-not-allowed"
                            value={user?.email || ''}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={updating}
                            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {updating ? (
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Check className="h-5 w-5" />
                                    Save Profile
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
