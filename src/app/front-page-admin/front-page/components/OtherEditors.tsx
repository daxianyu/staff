import { useState } from 'react';
import { SiteInfoResponse, updateApplication, updateJoinUs, updateBanner, updateHomePageIntro, uploadImage } from '@/services/modules/frontPage';

interface OtherEditorsProps {
    type: 'application' | 'join_us' | 'banner';
    siteInfo: SiteInfoResponse;
    onUpdate: () => void;
}

export default function OtherEditors({ type, siteInfo, onUpdate }: OtherEditorsProps) {
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            if (type === 'application') {
                await updateApplication({ content: formData.get('content') as string });
            } else if (type === 'join_us') {
                await updateJoinUs({ content: formData.get('content') as string });
            } else if (type === 'banner') {
                // Banner标签页用于更新首页Intro部分（home_page.intro）
                const title = formData.get('title') as string;
                const subtitle = formData.get('subtitle') as string;
                const imageFile = (formData.get('image') as File);

                let image_url = siteInfo.home_page.intro.image_url;
                if (imageFile && imageFile.size > 0) {
                    const uploadRes = await uploadImage(imageFile);
                    if (uploadRes.code === 200 && uploadRes.data) {
                        image_url = uploadRes.data.url;
                    }
                }

                await updateHomePageIntro({ title, subtitle, image_url, currentSiteInfo: siteInfo });
            }
            alert('Update successful');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Update failed');
        } finally {
            setLoading(false);
        }
    };

    if (type === 'banner') {
        return (
            <form onSubmit={handleUpdate} className="space-y-4 max-w-2xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        name="title"
                        defaultValue={siteInfo.home_page.intro.title}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subtitle</label>
                    <input
                        type="text"
                        name="subtitle"
                        defaultValue={siteInfo.home_page.intro.description}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Banner Image</label>
                    <div className="mt-2 flex items-center gap-4">
                        <img src={siteInfo.home_page.intro.image_url} alt="Current Banner" className="h-20 w-auto object-cover rounded" />
                        <input type="file" name="image" accept="image/*" />
                    </div>
                </div>
                <button type="submit" disabled={loading} className="btn btn-primary">
                    {loading ? 'Saving...' : 'Save Banner'}
                </button>
            </form>
        );
    }

    const content = type === 'application' ? siteInfo.application.content : siteInfo.join_us.content;

    return (
        <form onSubmit={handleUpdate} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Content (Markdown/HTML)</label>
                <textarea
                    name="content"
                    defaultValue={content}
                    rows={10}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
                />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Content'}
            </button>
        </form>
    );
}
