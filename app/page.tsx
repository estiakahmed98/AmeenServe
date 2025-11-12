"use client";

import useSWR from "swr";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fetcher = (url: string) => axios.get(url).then(r => r.data);

export default function Home() {
  const { data: services } = useSWR("/api/services", fetcher);

  const createOrder = async (serviceId: string) => {
    await axios.post("/api/orders", {
      serviceId,
      address: "Gulshan 2, Dhaka",
      latitude: 23.7925,
      longitude: 90.4078,
    });
    alert("Order created! Check dashboard.");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-semibold">Find a Service</h1>
      <div className="grid md:grid-cols-3 gap-4">
        {services?.map((s: any) => (
          <Card key={s.id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-muted-foreground">{s.category?.name}</div>
            </div>
            <Button onClick={() => createOrder(s.id)}>Book</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
