export function Img(props) {
  return (
    <figure>
      <img src={props.src.src} alt={props.alt} width={props.width} height={props.height} />
      <figcaption style={{ textAlign: "center", fontSize: "0.9em", color: "gray", marginTop: "4px" }}>
        {props.alt}
      </figcaption>
    </figure>
  );
}
