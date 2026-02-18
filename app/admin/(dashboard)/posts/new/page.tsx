import { PostEditor } from "@/components/admin/post-editor"

export default function NewPostPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-8">Criar Novo Post</h1>
      <PostEditor />
    </div>
  )
}
