import Image from "next/image";
import {propertiesApi} from "@/api/properties";

export default async function Home() {
  const properties = await propertiesApi.getPaginatedProperties()

  console.log(properties);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
    </div>
  );
}
