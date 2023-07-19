import { MJMLParseError } from "mjml-core"
import { renderToMjml } from "@faire/mjml-react/utils/renderToMjml"
import mjml2html from "mjml"

import fs from 'fs'

import { 
  Mjml, MjmlHead, MjmlTitle, MjmlPreview, MjmlBody, MjmlSection, MjmlColumn,
  MjmlImage, MjmlAll, MjmlAttributes, MjmlText, MjmlStyle, MjmlWrapper,
  MjmlDivider, MjmlSocialElement, MjmlSocial, MjmlGroup
} from "@faire/mjml-react"

import React from "react"


export const generateEmail = async (

): Promise<{ html: string, errors: MJMLParseError[] | undefined }> => {
  let output: JSX.Element[] = []

  const {html, errors} = mjml2html(renderToMjml(
    <Mjml>
      <MjmlHead>
        <MjmlTitle>Thank you for your Purchase!</MjmlTitle>
        <MjmlPreview>Thank you for your Purchase at AI Apparel!</MjmlPreview>
      </MjmlHead>
    </Mjml>
  ))

  return { html, errors }
}