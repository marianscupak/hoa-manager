/** What every template renders to. The API consumes only this shape. */
export interface RenderedEmail {
    subject: string;
    html: string;
    text: string;
}
