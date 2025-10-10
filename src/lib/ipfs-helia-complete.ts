import { createHelia } from 'helia'
import { unixfs } from '@helia/unixfs'
import type { Helia } from 'helia'

let heliaInstance: Helia | null = null

export const getHelia = async () => {
  if (!heliaInstance) {
    heliaInstance = await createHelia()
  }
  return heliaInstance
}

export const uploadToIPFS = async (file: File | Buffer) => {
  const helia = await getHelia()
  const fs = unixfs(helia)
  
  const data = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : file
  const cid = await fs.addBytes(data)
  
  return { cid: cid.toString(), size: data.length }
}

export const downloadFromIPFS = async (cid: string) => {
  const helia = await getHelia()
  const fs = unixfs(helia)
  
  const chunks = []
  for await (const chunk of fs.cat(cid)) {
    chunks.push(chunk)
  }
  
  return new Uint8Array(chunks.reduce((acc, chunk) => [...acc, ...chunk], []))
}