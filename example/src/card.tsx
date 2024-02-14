import React from 'react'
import { Repo } from './app'
import { useStore } from './store'

interface CardProps {
  isFavorite: boolean
  repository: Repo
}

export const Card = ({ repository, isFavorite }: CardProps) => {
  const add = useStore((state) => state.addRepo)
  const remove = useStore((state) => state.removeRepo)

  const toggleFavorite = () => {
    if (isFavorite) {
      return remove(repository.id)
    }
    add(repository.id)
  }

  return (
    <div>
      <h1>{repository.name}</h1>
      <button onClick={toggleFavorite}>
        {isFavorite ? 'dislike' : 'like'}
      </button>
    </div>
  )
}
