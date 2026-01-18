import { Fancybox } from "@fancyapps/ui";
import { useEffect } from "react";
// import "@fancyapps/ui/dist/fancybox/fancybox.css";

export default function ImageZoomer() {
  useEffect(() => {
    Fancybox.bind("article img", {
      groupAll: true,
      mainClass: "fancybox-custom",
    });
    return () => {
      Fancybox.destroy();
    };
  }, []);

  return <></>;
}
