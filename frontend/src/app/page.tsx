import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-5xl font-bold mb-6 text-center text-yellow-300">
        AI Bedtime Story Teller 🌙
      </h1>
      <p className="text-xl mb-8 text-center max-w-lg">
        Create magical, personalized bedtime stories for your kids in seconds.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="bg-white text-indigo-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition">
          Log In
        </Link>
        <Link href="/dashboard" className="bg-yellow-400 text-indigo-900 px-6 py-3 rounded-full font-bold hover:bg-yellow-300 transition">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
