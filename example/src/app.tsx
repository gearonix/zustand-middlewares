import { faker } from '@faker-js/faker'
import { Card } from './card'
import { useStore } from './store'

const repos = Array.from({ length: 15 }, (_, id) => ({
  id,
  name: faker.word.words()
}))

export interface Repo {
  id: number
  name: string
}

export const Application = () => {
  const { ids } = useStore()

  return (
    <>
      {repos.map((repository) => (
        <Card
          key={repository.id}
          repository={repository}
          isFavorite={ids.includes(repository.id)}
        />
      ))}
    </>
  )
}
