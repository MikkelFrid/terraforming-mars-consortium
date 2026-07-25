import {PlayerId} from '../../common/Types';
import {MegastructureId, MegastructureKind} from '../../common/consortium/MegastructureKind';

export type SerializedMegastructureSegment = {
  /** Player who paid for this segment; undefined if empty. */
  owner: PlayerId | undefined;
};

export type SerializedMegastructure = {
  id: MegastructureId;
  kind: MegastructureKind;
  /** Present for bridges (0 / 1 / 2). */
  sector?: number;
  segments: Array<SerializedMegastructureSegment>;
  completed: boolean;
  /** Player who placed the keystone; set on completion. */
  keystonePlayer?: PlayerId;
};

export type SerializedMegastructuresData = {
  structures: Array<SerializedMegastructure>;
};
