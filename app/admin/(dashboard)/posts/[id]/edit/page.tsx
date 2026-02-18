"use client"

import { useParams } from "next/navigation"
import useSWR from "swr"
import { PostEditor } from "@/components/admin/post-editor"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function EditPostPage() {
  const params = useParams()
  const id = params.id as string
  const { data, isLoading } = useSWR(`/api/admin/posts/${id}`, fetcher)

  if (isLoading) {
    return <p className="text-muted-foreground py-8">Carregando post...</p>
  }

  if (!data?.post) {
    return <p className="text-destructive py-8">Post nao encontrado.</p>
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Editar Post</h1>
      <PostEditor initialData={data.post} postId={Number(id)} />
    </div>
  )
}
