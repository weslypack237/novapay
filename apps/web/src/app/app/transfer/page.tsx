"use client";
import { ArrowLeftRight, HandCoins, Send, Wallet } from "lucide-react";
import { useFeature } from "@/components/app/features";
import { ListRow } from "@/components/app/rows";

export default function TransferPage() {
  const open = useFeature();
  return (
    <div className="mx-auto max-w-xl space-y-2.5">
      <ListRow Icon={Send} title="Send Money" subtitle="To a NovaPay user" onClick={() => open("send")} />
      <ListRow Icon={Wallet} title="Withdraw" subtitle="To mobile money or bank" onClick={() => open("withdraw")} />
      <ListRow Icon={ArrowLeftRight} title="Exchange" subtitle="Convert currencies" onClick={() => open("exchange")} />
      <ListRow Icon={HandCoins} title="Request Money" subtitle="Get paid easily" onClick={() => open("request")} />
    </div>
  );
}
