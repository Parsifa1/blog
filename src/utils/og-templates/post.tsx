import satori from "satori";
import type { CollectionEntry } from "astro:content";
import { SITE } from "@config";
import loadGoogleFonts, { type FontOptions } from "../loadGoogleFont";

export default async (post: CollectionEntry<"blog">) => {
  return satori(
    <div
      style={{
        background: "#fefbfb",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-1px",
          right: "-1px",
          border: "4px solid #000",
          background: "#ecebeb",
          opacity: "0.9",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "center",
          margin: "2.5rem",
          width: "88%",
          height: "80%",
        }}
      />

      <div
        style={{
          border: "4px solid #000",
          background: "#fefbfb",
          borderRadius: "4px",
          display: "flex",
          justifyContent: "center",
          margin: "2rem",
          width: "88%",
          height: "80%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "90%",
            height: "90%",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "90%",
              height: "90%",
            }}
          >
            <p
              style={{
                fontSize: 64,
                fontWeight: "bold",
                maxHeight: "84%",
                overflow: "hidden",
                marginBottom: "0px",
              }}
            >
              {post.data.title}
            </p>

            <p
              style={{
                fontSize: 42,
                maxHeight: "50%",
                overflow: "hidden",
              }}
            >
              {post.data.description}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              marginBottom: "8px",
              fontSize: 28,
            }}
          >
            {post.data.tags.map((tag: string) => (
              <abbr
                key={tag}
                style={{
                  fontSize: 32,
                  textDecoration: "underline dotted",
                  overflow: "hidden",
                  fontWeight: "bold",
                  marginLeft: "8px",
                  marginTop: "18px",
                }}
              >
                #{tag}
              </abbr>
            ))}

            <img
              src="https://i1.woh.to/2023/12/20/icon232e9f5a055dc93c.jpg"
              alt="avatar"
              width={80}
              height={80}
              style={{
                borderRadius: "9999px",
                marginLeft: "auto",
                marginBottom: "10px",
              }}
            />
            <span
              style={{
                overflow: "hidden",
                fontWeight: "bold",
                marginLeft: "12px",
                marginTop: "18px",
              }}
            >
              {SITE.title}
            </span>
          </div>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      embedFont: true,
      fonts: (await loadGoogleFonts(
        post.data.title +
          post.data.description +
          post.data.tags +
          SITE.title +
          "#" +
          " "
      )) as FontOptions[],
    }
  );
};
