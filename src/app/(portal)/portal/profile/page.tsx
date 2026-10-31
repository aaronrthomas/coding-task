'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { User, Building, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/portal/overview');
        const json = await res.json();
        if (json.success) {
          setProfile(json.data.customer);
        }
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile data...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-slate-500">Profile not found.</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Account Profile</h1>
        <p className="text-sm text-slate-500">
          Your corporate credentials and billing identification details
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg">
              {profile.name.charAt(0)}
            </div>
            <div>
              <CardTitle className="text-base">{profile.name}</CardTitle>
              <CardDescription>{profile.email}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-slate-400 text-[11px]">Company Name</Label>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 flex items-center gap-2">
                <Building className="h-3.5 w-3.5 text-slate-400" />
                {profile.companyName || 'Not specified'}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-slate-400 text-[11px]">Phone Number</Label>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                {profile.phone || 'Not specified'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-slate-400 text-[11px]">Billing Address</Label>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 flex items-start gap-2">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{profile.billingAddress || 'No billing address registered'}</span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-slate-400 text-[11px]">Tax Identification (GSTIN / VAT)</Label>
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 font-medium text-slate-800 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span>{profile.taxId || 'Not registered'}</span>
            </div>
          </div>

          <div className="pt-2 text-slate-400 text-[11px]">
            Account registered on {formatDate(profile.createdAt)}. For updates to your registered legal entity or billing address, please contact support@brightloop.com.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
