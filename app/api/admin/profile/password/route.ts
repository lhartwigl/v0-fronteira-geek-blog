import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { getDb } from "@/lib/db"

export async function PUT(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Nao autorizado" }, { status: 401 })
  }

  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Senha atual e nova senha sao obrigatorias." },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 }
      )
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "A nova senha deve ser diferente da atual." },
        { status: 400 }
      )
    }

    const sql = getDb()

    // Fetch user's current password
    const users = await sql`
      SELECT id, password FROM users WHERE id = ${session.userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 })
    }

    const user = users[0]

    // Verify current password matches
    if (user.password !== currentPassword) {
      return NextResponse.json(
        { error: "Senha atual incorreta." },
        { status: 403 }
      )
    }

    // Update to new password
    await sql`
      UPDATE users SET password = ${newPassword} WHERE id = ${session.userId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json(
      { error: "Erro ao alterar a senha." },
      { status: 500 }
    )
  }
}
