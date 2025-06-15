import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


export const generateRandomProfile = async function() {
  const name = uniqueNamesGenerator({
    dictionaries: [adjectives, colors, animals],
    separator: ' ',
    style: 'capital'
  })

  // Generate username (lowercase, no spaces)
  const username = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: '',
    style: 'lowerCase'
  }) + Math.floor(Math.random() * 10000)

  // Generate avatar using DiceBear (or similar)
  const avatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`

  console.log(name, username, avatar)

  return {name, username, avatar_url: avatar}
}
