<template>
  <div class="resource_items_cont">
    <PlayerResource
      :type="Resource.MEGACREDITS"
      :count="player.megacredits"
      :production="player.megacreditProduction"
      :resourceProtection="player.protectedResources.megacredits"
      :productionProtection="player.protectedProduction.megacredits"/>
    <PlayerResource
      :type="Resource.STEEL"
      :count="player.steel"
      :production="player.steelProduction"
      :value="player.steelValue"
      :resourceProtection="player.protectedResources.steel"
      :productionProtection="player.protectedProduction.steel"/>
    <!-- TODO LUNA TRADE FEDERATION -->
    <PlayerResource
      :type="Resource.TITANIUM"
      :count="player.titanium"
      :production="player.titaniumProduction"
      :value="player.titaniumValue"
      :resourceProtection="player.protectedResources.titanium"
      :productionProtection="player.protectedProduction.titanium"/>
    <PlayerResource
      :type="Resource.PLANTS"
      :count="player.plants"
      :production="player.plantProduction"
      :resourceProtection="player.protectedResources.plants"
      :productionProtection="player.protectedProduction.plants"/>
    <PlayerResource
      :type="Resource.ENERGY"
      :count="player.energy"
      :production="player.energyProduction"
      :resourceProtection="player.protectedResources.energy"
      :productionProtection="player.protectedProduction.energy"/>
    <PlayerResource
      :type="Resource.HEAT"
      :count="player.heat"
      :production="player.heatProduction"
      :value="canUseHeatAsMegaCredits ? 1 : 0"
      :resourceProtection="player.protectedResources.heat"
      :productionProtection="player.protectedProduction.heat"/>
    <!--
      Consortium iridium: LAST column (after heat), deliberately away from
      steel/titanium so the panel does not imply universal spendability.
      Stock only — no production, no M€ value badge. Tag-gated payment.
      PlayerInfo uses this component for both the active player and opponents.
    -->
    <div class="resource_item resource_item--iridium">
      <div class="resource_item_stock">
        <i class="resource_icon resource_icon--iridium tooltip tooltip-bottom" data-tooltip="Iridium"></i>
        <div class="resource_item_stock_count" data-test="iridium-stock-count">{{ player.iridium }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import PlayerResource from '@/client/components/overview/PlayerResource.vue';
import {Resource} from '@/common/Resource';

export default defineComponent({
  name: 'PlayerResources',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
  },
  computed: {
    Resource(): typeof Resource {
      return Resource;
    },
    // TODO LUNA TRADE FEDERATION
    canUseHeatAsMegaCredits(): boolean {
      return this.player.tableau.some((card) => card.name === CardName.HELION);
    },
  },
  components: {
    PlayerResource,
  },
});
</script>
