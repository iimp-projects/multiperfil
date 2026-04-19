"use client";

import { useVertical } from "@nrivera-iimp/ui-kit-iimp";
import Image from "next/image";

export default function AuthHeader() {
    const { vertical } = useVertical();

    const getLogo = () => {
        switch (vertical) {
            case "gess": return "/logos/logo-gess.png";
            case "wmc": return "/logos/logo-wmc.png";
            case "proexplo": return "/logos/logo-iimp.png";
            default: return "/logos/logo-iimp.png";
        }
    };

    return (
        <div className="text-center mb-10 flex flex-col items-center">
            <div className="relative h-16 w-64 transition-all duration-500 hover:scale-105">
                <Image
                    src={getLogo()}
                    alt={`${vertical} logo`}
                    fill
                    className="object-contain"
                    priority
                />
            </div>
        </div>
    );
}
