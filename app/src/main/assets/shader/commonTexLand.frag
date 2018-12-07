#version 400
#extension GL_ARB_separate_shader_objects : enable
#extension GL_ARB_shading_language_420pack : enable
layout (std140,set = 0, binding = 7) uniform bufferVals { 		//一致块
    vec4 uCamaraLocation;							//摄像机位置
    float startAngle;									//正弦函数起始角
} myBufferVals;
layout (binding = 1) uniform sampler2D texC; 				//纹理采样器(基础颜色纹理)
layout (binding = 2) uniform sampler2D texD; 				//纹理采样器(过程纹理)
layout (binding = 3) uniform sampler2D texD1; 				//纹理采样器(细节纹理1)
layout (binding = 4) uniform sampler2D texD2; 				//纹理采样器(细节纹理2)
layout (binding = 5) uniform sampler2D texD3; 				//纹理采样器(细节纹理3)
layout (binding = 6) uniform sampler2D texD4; 				//纹理采样器(细节纹理4)
layout (location = 0) in vec2 inTexCoor; 					//接收的纹理坐标
layout (location = 1) in vec4 inLightQD; 					//接收的最终光照强度
layout (location = 2) in vec4 pLocation;					//接收的当前片元位置(世界坐标系)
layout (location = 0) out vec4 outColor; 					//输出到管线的片元颜色
const float slabY=90.0f;								//雾平面的高度
const float QFheight=10.0f;							//雾平面的高度扰动范围
const float WAngleSpan=12*3.1415926f;					//雾的总角度跨度(12个周期)
float tjFogCal(vec4 pLocation){							//计算体积雾浓度因子的方法
    float xAngle=pLocation.x/960.0f*WAngleSpan;			//根据 X坐标折算出的扰动角度
    float zAngle=pLocation.z/960.0f*WAngleSpan;			//根据 Z 坐标折算出的扰动角度
    float slabYFactor=	//联合起始角计算出角度和的正弦值，再结合高度扰动范围计算出当前片元对应
       sin(xAngle+zAngle+myBufferVals.startAngle)*QFheight; //雾平面的高度扰动值
    float t=(slabY+slabYFactor-myBufferVals.uCamaraLocation.y) //求从摄像机到当前片元的射线参数
              /(pLocation.y-myBufferVals.uCamaraLocation.y);//方程 Pc+(Pp-Pc)t 与雾平面交点的 t 值
    if(t>0.0&&t<1.0){         //若 t 值在有效范围内(即交点高于片元位置)
        float xJD=myBufferVals.uCamaraLocation.x+(pLocation.x-myBufferVals.uCamaraLocation.x)*t;
        float zJD=myBufferVals.uCamaraLocation.z+(pLocation.z-myBufferVals.uCamaraLocation.z)*t;
        vec3 locationJD=vec3(xJD,slabY+slabYFactor,zJD);  //得到射线与雾平面的交点坐标
        float L=distance(locationJD,pLocation.xyz);   //求出交点到当前片元位置的距离
        const float L0=20.0;       //给出体积雾浓度控制因子
        return L0/(L+L0);        //计算体积雾的雾浓度因子并返回
    }else{return 1.0f;}     //若当前片元不在雾平面以下，则此片元不受雾影响
}
void main() { 										//主函数
    	float dtScale1=27.36; 							//细节纹理1 的缩放系数
    	float dtScale2=20.00; 							//细节纹理2 的缩放系数
    	float dtScale3=32.34; 							//细节纹理3 的缩放系数
    	float dtScale4=22.39; 							//细节纹理4 的缩放系数
    	float ctSize=257; 								//地形灰度图的尺寸(以像素为单位)
    	float factor1=ctSize/dtScale1; 						//细节纹理1 的纹理坐标缩放系数
    	float factor2=ctSize/dtScale2; 						//细节纹理2 的纹理坐标缩放系数
    	float factor3=ctSize/dtScale3; 						//细节纹理3 的纹理坐标缩放系数
    	float factor4=ctSize/dtScale4; 						//细节纹理4 的纹理坐标缩放系数
    	vec4 cT = textureLod(texC,inTexCoor,0.0); 			//从基础颜色纹理中采样
    	vec4 dT = textureLod(texD,inTexCoor,0.0); 			//从过程纹理中采样
	vec4 dT1 = textureLod(texD1,inTexCoor*factor1,0.0); 	//从细节纹理1 中采样
	vec4 dT2 = textureLod(texD2,inTexCoor*factor2,0.0); 	//从细节纹理2 中采样
	vec4 dT3 = textureLod(texD3,inTexCoor*factor3,0.0); 	//从细节纹理3 中采样
	vec4 dT4 = textureLod(texD4,inTexCoor*factor4,0.0); 	//从细节纹理4 中采样
	outColor = dT1*dT.r+dT2*dT.g+dT3*dT.b+dT4*dT.a; 	//叠加细节纹理的颜色值
	outColor = outColor + cT; 						//叠加基础颜色值
	outColor = outColor - 0.8; 			//调整颜色整体亮度(防止由于叠加后值超过1.0而失真）
	outColor = inLightQD * outColor;					//结合光照强度计算光照后颜色值
	float fogFactor=tjFogCal(pLocation);					//计算体积雾浓度因子
	const vec4 fogColor=vec4(0.9765,0.98,0.99,0.0);			//体积雾颜色
	outColor=fogFactor*outColor+ (1.0-fogFactor)* fogColor;	//结合雾颜色、雾浓度计算片元最终颜色值
}