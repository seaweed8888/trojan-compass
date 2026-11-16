import type { Reconstruction } from './types.js'
import { DML_RECONSTRUCTION } from './dml.js'
import { LVL_RECONSTRUCTION } from './lvl.js'
import { THH_RECONSTRUCTION } from './thh.js'
import { VKC_RECONSTRUCTION } from './vkc.js'
import { TCC_RECONSTRUCTION } from './tcc.js'
import { SGM_RECONSTRUCTION } from './sgm.js'
import { SAL_RECONSTRUCTION } from './sal.js'
import { KAP_RECONSTRUCTION } from './kap.js'
import { SCA_RECONSTRUCTION } from './sca.js'

export const INTERIORS: Record<string, Reconstruction> = {
  DML: DML_RECONSTRUCTION,
  LVL: LVL_RECONSTRUCTION,
  THH: THH_RECONSTRUCTION,
  VKC: VKC_RECONSTRUCTION,
  TCC: TCC_RECONSTRUCTION,
  SGM: SGM_RECONSTRUCTION,
  SAL: SAL_RECONSTRUCTION,
  KAP: KAP_RECONSTRUCTION,
  SCA: SCA_RECONSTRUCTION,
}
