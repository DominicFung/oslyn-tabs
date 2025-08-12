import React from 'react'
import {Text, View, Image, Pressable, Dimensions } from 'react-native'

export interface ClickableCellProps {
  children: React.ReactNode
  onClick: () => void
  className?: string
}

export default function ClickableCell({ children, onClick, className }: ClickableCellProps) {
  return <Pressable className={`${className} hover:cursor-pointer`} onPress={onClick}>
    {children}
  </Pressable>
}