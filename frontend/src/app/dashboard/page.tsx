'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Dashboard() {
  const [stories, setStories] = useState<any[]>([])
  
  useEffect(() => {
    fetchStories()
  }, [])

  async function fetchStories() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    
    const { data } = await supabase
      .from('stories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (data) setStories(data)
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Stories</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stories.map(story => (
          <div key={story.id} className="p-4 border rounded-xl shadow-sm hover:shadow-md transition">
            <h2 className="font-bold text-xl mb-2">{story.title}</h2>
            <p className="text-gray-600 line-clamp-3 mb-4">{story.content}</p>
            {story.audio_url && (
              <audio controls className="w-full">
                <source src={story.audio_url} type="audio/mpeg" />
              </audio>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
