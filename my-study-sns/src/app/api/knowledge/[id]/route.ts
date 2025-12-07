import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: cardId } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    try {
        // 1. 인증 확인
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
        }

        // 2. 지식카드 조회 및 권한 확인
        const { data: card, error: findError } = await supabase
            .from("knowledge_cards")
            .select("user_id")
            .eq("id", cardId)
            .single();

        if (findError || !card) {
            return NextResponse.json({ error: "지식카드를 찾을 수 없습니다." }, { status: 404 });
        }

        if (card.user_id !== user.id) {
            return NextResponse.json({ error: "삭제 권한이 없습니다." }, { status: 403 });
        }

        // 3. 삭제
        const { error: deleteError } = await supabase
            .from("knowledge_cards")
            .delete()
            .eq("id", cardId);

        if (deleteError) {
            console.error("Delete Error:", deleteError);
            return NextResponse.json({ error: deleteError.message }, { status: 500 });
        }

        return NextResponse.json({ message: "지식카드가 삭제되었습니다." });

    } catch (error: unknown) {
        console.error("Knowledge Card Delete Error:", error);
        const message = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
