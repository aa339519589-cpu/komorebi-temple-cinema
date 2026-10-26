// Explicit Cycles CPU + Embree compact storage. No model/attribute reduction.
// This changes the backend and accounts for its actual shared host buffers;
// the existing 14GiB own-process cap and 3GiB available reserve remain intact.
export const CPU_BACKEND_354='CPU_EMBREE_COMPACT';
export const CPU_MEMORY_EVIDENCE_354={
 blenderVersion:'5.2.1',embreeVersion:'4.4.1',
 cpuPointers:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/device/cpu/device_impl.cpp#L81-L125',
 embreeSharedBuffers:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/bvh/embree.cpp#L314-L415',
 compactFlag:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/bvh/embree.cpp#L124-L137',
 meshArrays:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/scene/mesh.h#L143-L146',
 meshSync:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/blender/mesh.cpp#L649-L673',
 packedTriangles:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/scene/mesh.cpp#L873-L913',
 attributeTables:'https://github.com/blender/blender/blob/v5.2.1/intern/cycles/scene/geometry_attributes.cpp#L300-L408',
 indexedCompactChoice:'https://github.com/RenderKit/embree/blob/v4.4.1/kernels/common/scene.cpp#L159-L192',
 compactLeafFields:'https://github.com/RenderKit/embree/blob/v4.4.1/kernels/geometry/trianglei.h#L187-L193',
 compactBuilderEstimate:'https://github.com/RenderKit/embree/blob/v4.4.1/kernels/bvh/bvh_builder_sah.cpp#L149-L154',
};
export function cpuMemoryBudget354(c){
 const v=c.vertices+c.bakedVertices,t=c.triangles+c.bakedTriangles;
 const blenderMeshes=v*64+t*144+(c.uvLoops+c.bakedUVLoops)*8+(c.uvPointVertices+c.bakedUVPointVertices)*12+c.retainedSourceAttributeBytes+c.bakedVertices*36;
 // Mesh host arrays: 12B triangle indices + 4B shader + 1B smooth/T.
 // Packed kernel arrays: 12B packed_uint3 + 4B shader/T. CPU uses the
 // host allocation directly; no additional Metal device allocation exists.
 // Position and packed normal are 12B+4B/V in each of the two tables.
 // Source UV, color/custom fields and affine instance fields retain both
 // host and packed representations explicitly. No precision is changed.
 const cyclesHostAndKernelArrays=t*33+v*32+(c.uvPointVertices+c.bakedUVPointVertices)*24+(c.uvLoops+c.bakedUVLoops)*16+c.retainedSourceAttributeBytes*2+c.bakedVertices*72;
 // Embree's compact Triangle4i has five uint4 fields = 80B/4 triangles.
 // Its own SAH allocator estimates 1.2*leaf bytes plus AABBNodeMB/(4*N),
 // approximately 38B/T on BVH4. Use 48B/T for leaf occupancy/allocator
 // variation, plus 256B per retained instance. This is an estimate, not a
 // proven worst-case bound or an assertion that compact is quantization.
 const compactEmbreeBVH=t*48+c.sourceInstances*256;
 // Keep the earlier conservative decoded-image/device-mipmap envelope.
 // CPU image allocation also aliases host memory, but no image savings are
 // needed or assumed for this current full-scene budget.
 const decodedImages=c.imagePixels*16*2.5;
 const pointAndInstanceAttributes=c.sourceInstances*192;
 const applicationBuildScratchRenderAndDenoise=2*1024**3;
 const base={blenderMeshes,decodedImages,pointAndInstanceAttributes,applicationBuildScratchRenderAndDenoise};
 const importParts={...base,boundedSourceBufferWorkingSet:c.sourceBufferCacheBytes+c.largestGeometryPayloadBytes,largestAttributeTransferTemporary:c.maxVertices*64};
 // All geometry data dicts are dropped by import_geometry, and the caller
 // explicitly clears the bounded payload cache before Cycles sync starts.
 // Consequently the largest source/transfer temporaries do not coexist
 // with the complete Cycles + Embree tables at the render peak.
 const renderParts={...base,cyclesHostAndKernelArrays,compactEmbreeBVH};
 const sum=x=>Math.ceil(Object.values(x).reduce((a,b)=>a+b,0));
 const stages={exactImport:{parts:importParts,estimatedResidentBytes:sum(importParts)},fullSceneCpuPathTrace:{parts:renderParts,estimatedResidentBytes:sum(renderParts)}};
 const estimatedResidentBytes=Math.max(...Object.values(stages).map(x=>x.estimatedResidentBytes));
 return {backend:CPU_BACKEND_354,parts:renderParts,stages,estimatedResidentBytes,storageCounts:{vertices:v,triangles:t,sourceEffectiveTriangles:c.effective,sourceInstances:c.sourceInstances},evidence:CPU_MEMORY_EVIDENCE_354,assumption:'CPU shared host pointers and compact indexed BVH; unchanged conservative Blender mesh and image envelopes, explicit full host+kernel attributes, 48B/T compact BVH allowance, and fixed 2GiB application/build-scratch/render/denoise headroom. Import and trace peaks are disjoint after an explicit source-cache release. This backend-specific sum replaces the older blanket Metal estimate and 25% multiplier; it does not raise either resource threshold. Actual RSS/available monitoring remains authoritative.',unmeasuredRisks:['Embree allocator/leaf occupancy and build scratch are implementation-based estimates, not a measured full-scene bound.','The existing official job must terminate its own process if actual RSS exceeds 14GiB or available/reclaimable memory drops below 3GiB.'],noMetalDeviceCopy:true,allGeometryAttributesInstancesAndLightTransportHeld:true};
}
