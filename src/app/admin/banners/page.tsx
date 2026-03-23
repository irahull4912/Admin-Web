"use client";

import { useState, useEffect } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Image as ImageIcon, Link as LinkIcon, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  createdAt?: any;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bannerList: Banner[] = [];
      snapshot.forEach((doc) => {
        bannerList.push({ id: doc.id, ...doc.data() } as Banner);
      });
      setBanners(bannerList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      toast({ variant: "destructive", title: "Missing Image", description: "Please select an image." });
      return;
    }

    if (!auth?.currentUser) return;
    setUploading(true);
    
    try {
      const idToken = await auth.currentUser.getIdToken();
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("linkUrl", linkUrl);
      formData.append("altText", altText);
      formData.append("isActive", isActive.toString());

      const res = await fetch("/api/admin/banners", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${idToken}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload");

      toast({ title: "Success", description: "Banner uploaded successfully." });
      setImageFile(null);
      setLinkUrl("");
      setAltText("");
      setIsActive(true);
      (document.getElementById("image-upload-input") as HTMLInputElement).value = "";
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setUploading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "banners", id), {
        isActive: !currentStatus
      });
      toast({ title: "Updated", description: "Banner status updated successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
  };

  const deleteBanner = async (id: string) => {
    if (!db || !confirm("Are you sure you want to delete this banner?")) return;
    try {
      await deleteDoc(doc(db, "banners", id));
      toast({ title: "Deleted", description: "Banner removed from database." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete banner." });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-slate-900 tracking-tight">Banner Management</h1>
          <p className="text-slate-500 mt-1">Upload and manage promotional banners seamlessly.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200/60 shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5 text-primary" />
                Upload New Banner
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleUpload} className="space-y-5">
                <Alert className="bg-blue-50 text-blue-800 border-blue-200 shadow-sm">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs font-medium ml-2">
                    Constraint: Images should be optimized for <strong>1376x448 pixels</strong> for the best display.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label htmlFor="image" className="text-xs font-bold uppercase tracking-widest text-slate-500">Image File <span className="text-red-500">*</span></Label>
                  <Input 
                    id="image-upload-input"
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="cursor-pointer file:text-primary file:font-semibold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkUrl" className="text-xs font-bold uppercase tracking-widest text-slate-500">Destination Link</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      placeholder="https://example.com/promo" 
                      className="pl-9"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="altText" className="text-xs font-bold uppercase tracking-widest text-slate-500">Alt Text</Label>
                  <Input 
                    placeholder="E.g., Summer Sale Banner" 
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Active Status</Label>
                    <p className="text-xs text-muted-foreground">Publish immediately upon upload</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>

                <Button type="submit" className="w-full font-bold shadow-lg shadow-primary/20" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Uploading...
                    </>
                  ) : "Upload Banner"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-slate-200/60 shadow-md h-full min-h-[500px] flex flex-col">
            <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl flex-shrink-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ImageIcon className="h-5 w-5 text-primary" />
                Active & Past Banners
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : banners.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center gap-3">
                  <ImageIcon className="h-12 w-12 opacity-20" />
                  <p>No banners uploaded yet. Use the form to add one.</p>
                </div>
              ) : (
                <div className="overflow-y-auto h-full p-4 space-y-4 custom-scrollbar">
                  {banners.map((banner) => (
                    <div key={banner.id} className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20">
                      <div className="flex flex-col sm:flex-row h-full">
                        <div className="w-full sm:w-1/3 h-40 sm:h-auto relative bg-slate-100 overflow-hidden border-b sm:border-b-0 sm:border-r border-slate-100 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={banner.imageUrl} 
                            alt={banner.altText || "Banner image"} 
                            className={`w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105 ${!banner.isActive ? 'grayscale opacity-75' : ''}`}
                            loading="lazy"
                          />
                          {!banner.isActive && (
                            <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[1px]">
                              <span className="bg-slate-900/80 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">Inactive</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                          <div className="space-y-1">
                            <h3 className="font-semibold text-slate-900 truncate" title={banner.altText || "Untitled Banner"}>
                              {banner.altText || <span className="text-slate-400 italic">No Alt Text Provided</span>}
                            </h3>
                            <div className="flex font-mono text-[10px] text-slate-500 break-all overflow-hidden">
                              {banner.linkUrl ? (
                                <a href={banner.linkUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors hover:underline truncate">
                                  <LinkIcon className="h-3 w-3 flex-shrink-0" />
                                  {banner.linkUrl}
                                </a>
                              ) : (
                                <span className="opacity-50">No destination link</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3">
                              <Switch 
                                checked={banner.isActive} 
                                onCheckedChange={() => toggleStatus(banner.id, banner.isActive)}
                                id={`status-${banner.id}`}
                              />
                              <Label htmlFor={`status-${banner.id}`} className={`text-xs font-semibold cursor-pointer ${banner.isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {banner.isActive ? "Live" : "Draft"}
                              </Label>
                            </div>
                            
                            <Button variant="ghost" size="icon" onClick={() => deleteBanner(banner.id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
