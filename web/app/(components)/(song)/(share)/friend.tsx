"use client"

import { User } from "@/../src/API";

interface FriendProps {
  friends: User[]
}

export default function Friends(p: FriendProps) {
  return <>
    <div className="px-6 py-6 lg:px-8">
      <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Share</h3>
      <span className="space-y-6">


      </span>
    </div>
  </>
}