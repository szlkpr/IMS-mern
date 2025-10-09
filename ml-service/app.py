"""
Advanced ML Microservice for Inventory Management
Integrates the Neuro-Symbolic Physics-Informed Forecasting System
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
import json
import asyncio
from datetime import datetime, timedelta
import logging
import sys
import os

# Add the parent directory to path to import capmodel
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    # Import your ML model components
    from capmodel import (
        IndianMarketKnowledgeGraph,
        NeuroSymbolicPhysicsForecaster,
        MarketState,
        ForecastResult
    )
    ML_MODEL_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Could not import ML model: {e}")
    ML_MODEL_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Inventory ML Service",
    description="Advanced Analytics and Predictions for Inventory Management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:4200", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for API
class HistoricalDataPoint(BaseModel):
    date: str
    value: float
    quantity: Optional[int] = None
    price: Optional[float] = None

class ForecastRequest(BaseModel):
    product_name: str
    historical_data: List[HistoricalDataPoint]
    forecast_horizon: int = 30
    include_scenarios: bool = True

class PredictionResponse(BaseModel):
    success: bool
    product_name: str
    predictions: List[float]
    confidence_intervals: Dict[str, List[float]]
    certainty_score: float
    explanations: Dict[str, Any]
    recommendations: List[str]
    narrative: str

class MarketAnalysisRequest(BaseModel):
    products: List[str]
    analysis_type: str = "stability"  # stability, trends, causality

# Global ML forecaster instance
ml_forecaster = None

@app.on_event("startup")
async def startup_event():
    """Initialize ML model on startup"""
    global ml_forecaster
    
    if ML_MODEL_AVAILABLE:
        try:
            logger.info("Initializing ML Forecaster...")
            
            # Initialize with common product categories
            product_categories = [
                "electronics", "groceries", "clothing", "books",
                "tools", "medicines", "cosmetics", "sports"
            ]
            
            ml_forecaster = NeuroSymbolicPhysicsForecaster(product_categories)
            logger.info("ML Forecaster initialized successfully!")
            
        except Exception as e:
            logger.error(f"Failed to initialize ML Forecaster: {e}")
            ml_forecaster = None
    else:
        logger.warning("ML model not available - running in mock mode")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "ml_model_available": ML_MODEL_AVAILABLE,
        "forecaster_initialized": ml_forecaster is not None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/predict/demand", response_model=PredictionResponse)
async def predict_demand(request: ForecastRequest):
    """Generate demand predictions for a product"""
    
    if not ml_forecaster:
        # Mock response for development
        return generate_mock_prediction(request)
    
    try:
        # Convert request data to DataFrame
        data_records = []
        for point in request.historical_data:
            data_records.append({
                'date': point.date,
                'value': point.value,
                'price': point.price or point.value,
                'quantity': point.quantity or 1
            })
        
        df = pd.DataFrame(data_records)
        df['date'] = pd.to_datetime(df['date'])
        
        # Check if we need to train the model first
        if not ml_forecaster.trained:
            logger.info("Training ML model with provided data...")
            historical_data = {request.product_name: df}
            ml_forecaster.train(historical_data, epochs=50)
        
        # Generate forecast
        forecast_result = ml_forecaster.forecast(
            product=request.product_name,
            historical_data=df,
            forecast_horizon=request.forecast_horizon,
            generate_scenarios=request.include_scenarios
        )
        
        # Convert to response format
        return PredictionResponse(
            success=True,
            product_name=request.product_name,
            predictions=forecast_result.predictions.tolist(),
            confidence_intervals=_convert_confidence_intervals(forecast_result.confidence_intervals),
            certainty_score=forecast_result.certainty_score,
            explanations={
                "symbolic_rules": forecast_result.symbolic_rules_applied,
                "causal_chain": forecast_result.causal_chain,
                "physics_constraints": forecast_result.physics_constraints,
                "market_dynamics": forecast_result.market_dynamics,
                "feature_importance": forecast_result.feature_importance
            },
            recommendations=forecast_result.recommendations,
            narrative=forecast_result.narrative
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/market-stability")
async def analyze_market_stability(request: MarketAnalysisRequest):
    """Analyze market stability for multiple products"""
    
    if not ml_forecaster:
        return {
            "success": False,
            "message": "ML model not available",
            "analysis": {}
        }
    
    try:
        stability_analysis = {}
        
        for product in request.products:
            # Get knowledge graph insights
            kg_summary = ml_forecaster.kg.get_knowledge_summary()
            related_entities = ml_forecaster.kg.get_related_entities(product, max_hops=2)
            symbolic_rules = ml_forecaster.kg.extract_symbolic_rules(product)
            
            stability_analysis[product] = {
                "related_entities": related_entities,
                "applicable_rules": len(symbolic_rules),
                "rule_details": symbolic_rules,
                "market_connections": len(related_entities),
                "stability_factors": _analyze_stability_factors(product, related_entities)
            }
        
        return {
            "success": True,
            "analysis_type": request.analysis_type,
            "products_analyzed": len(request.products),
            "analysis": stability_analysis,
            "knowledge_graph_summary": kg_summary,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Market analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain/prediction")
async def explain_prediction(
    product_name: str,
    prediction_value: float,
    context: Dict[str, Any]
):
    """Generate detailed explanation for a specific prediction"""
    
    if not ml_forecaster:
        return generate_mock_explanation(product_name, prediction_value)
    
    try:
        # Build context for symbolic reasoning
        symbolic_context = {
            'product': product_name,
            'entities': [product_name],
            'current_price': context.get('current_price', prediction_value),
            'demand_level': context.get('demand_level', 'normal'),
            'days_offset': 0
        }
        
        # Get symbolic reasoning explanation
        reasoning_result = ml_forecaster.reasoner.infer(
            f"Why will {product_name} price be {prediction_value}?",
            symbolic_context
        )
        
        # Get causal explanations
        causal_explanation = ml_forecaster.causal_engine.counterfactual_analysis(
            scenario={'price': prediction_value},
            baseline={'price': context.get('baseline_price', prediction_value * 0.9)}
        )
        
        return {
            "success": True,
            "product": product_name,
            "prediction": prediction_value,
            "explanation": {
                "reasoning_chain": reasoning_result['reasoning_chain'],
                "applicable_rules": reasoning_result['applicable_rules'],
                "confidence": reasoning_result['confidence'],
                "causal_effects": causal_explanation['causal_effects'],
                "counterfactual_analysis": causal_explanation
            },
            "human_readable": _generate_human_explanation(
                product_name, prediction_value, reasoning_result, causal_explanation
            )
        }
        
    except Exception as e:
        logger.error(f"Explanation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/optimize/inventory")
async def optimize_inventory_levels(
    product_data: Dict[str, Dict[str, Any]],
    optimization_goal: str = "minimize_cost"
):
    """Optimize inventory levels using ML predictions"""
    
    try:
        optimization_results = {}
        
        for product_name, data in product_data.items():
            current_stock = data.get('current_stock', 0)
            reorder_point = data.get('reorder_point', 10)
            max_stock = data.get('max_stock', 100)
            
            # Generate short-term forecast for inventory planning
            if ml_forecaster and ml_forecaster.trained:
                # Mock historical data for optimization
                mock_data = pd.DataFrame({
                    'date': pd.date_range(start='2023-01-01', periods=30),
                    'value': np.random.normal(50, 10, 30)
                })
                
                forecast = ml_forecaster.forecast(
                    product=product_name,
                    historical_data=mock_data,
                    forecast_horizon=7,
                    generate_scenarios=False
                )
                
                predicted_demand = np.mean(forecast.predictions)
            else:
                predicted_demand = data.get('avg_demand', 10)
            
            # Simple optimization logic
            if optimization_goal == "minimize_cost":
                optimal_stock = min(predicted_demand * 7, max_stock)  # 7 days supply
            elif optimization_goal == "maximize_availability":
                optimal_stock = min(predicted_demand * 14, max_stock)  # 14 days supply
            else:
                optimal_stock = predicted_demand * 10  # 10 days supply
            
            optimization_results[product_name] = {
                "current_stock": current_stock,
                "predicted_demand": predicted_demand,
                "recommended_stock": optimal_stock,
                "reorder_needed": current_stock < optimal_stock,
                "reorder_quantity": max(0, optimal_stock - current_stock),
                "risk_level": "high" if current_stock < predicted_demand * 3 else "low"
            }
        
        return {
            "success": True,
            "optimization_goal": optimization_goal,
            "products_optimized": len(product_data),
            "results": optimization_results,
            "summary": _generate_optimization_summary(optimization_results)
        }
        
    except Exception as e:
        logger.error(f"Optimization error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/insights/knowledge-graph/{product}")
async def get_knowledge_graph_insights(product: str):
    """Get knowledge graph insights for a specific product"""
    
    if not ml_forecaster:
        return {"success": False, "message": "ML model not available"}
    
    try:
        kg = ml_forecaster.kg
        
        # Get comprehensive insights
        related_entities = kg.get_related_entities(product, max_hops=2)
        symbolic_rules = kg.extract_symbolic_rules(product)
        
        # Get temporal impacts
        temporal_impacts = {}
        for entity, weight in related_entities[:5]:
            for days_offset in [-7, -1, 0, 1, 7]:
                impact = kg.get_temporal_impact(entity, product, days_offset)
                if impact > 0:
                    if entity not in temporal_impacts:
                        temporal_impacts[entity] = []
                    temporal_impacts[entity].append({
                        "days_offset": days_offset,
                        "impact": impact
                    })
        
        return {
            "success": True,
            "product": product,
            "related_entities": related_entities,
            "symbolic_rules": symbolic_rules,
            "temporal_impacts": temporal_impacts,
            "knowledge_summary": kg.get_knowledge_summary(),
            "insights": _generate_product_insights(product, related_entities, symbolic_rules)
        }
        
    except Exception as e:
        logger.error(f"Knowledge graph error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Helper functions
def generate_mock_prediction(request: ForecastRequest) -> PredictionResponse:
    """Generate mock prediction for development/testing"""
    
    # Simple trend-based prediction
    values = [point.value for point in request.historical_data]
    trend = np.polyfit(range(len(values)), values, 1)[0]
    
    predictions = []
    base_value = values[-1]
    
    for i in range(request.forecast_horizon):
        pred = base_value + (trend * (i + 1)) + np.random.normal(0, base_value * 0.1)
        predictions.append(max(0, pred))
    
    return PredictionResponse(
        success=True,
        product_name=request.product_name,
        predictions=predictions,
        confidence_intervals={
            "lower": [p * 0.9 for p in predictions],
            "upper": [p * 1.1 for p in predictions]
        },
        certainty_score=0.75,
        explanations={
            "method": "trend_based",
            "trend": trend,
            "note": "Mock prediction - ML model not loaded"
        },
        recommendations=[
            f"Monitor {request.product_name} closely",
            f"Trend shows {'increase' if trend > 0 else 'decrease'} in demand",
            "Consider adjusting inventory levels accordingly"
        ],
        narrative=f"Based on historical trends, {request.product_name} is expected to {'increase' if trend > 0 else 'decrease'} over the next {request.forecast_horizon} days."
    )

def generate_mock_explanation(product_name: str, prediction_value: float):
    """Generate mock explanation"""
    return {
        "success": True,
        "product": product_name,
        "prediction": prediction_value,
        "explanation": {
            "method": "mock",
            "factors": ["historical_trend", "seasonal_pattern"],
            "confidence": 0.7
        },
        "human_readable": f"The prediction for {product_name} is based on historical patterns and shows expected value of {prediction_value:.2f}"
    }

def _convert_confidence_intervals(intervals: Dict[str, np.ndarray]) -> Dict[str, List[float]]:
    """Convert numpy arrays to lists for JSON serialization"""
    result = {}
    for key, array in intervals.items():
        if hasattr(array, 'tolist'):
            result[key] = array.tolist()
        else:
            result[key] = list(array)
    return result

def _analyze_stability_factors(product: str, related_entities: List[tuple]) -> Dict[str, Any]:
    """Analyze stability factors for a product"""
    return {
        "connection_strength": len(related_entities),
        "risk_factors": [entity for entity, weight in related_entities if weight > 2.0],
        "stability_score": min(1.0, 1.0 / (len(related_entities) + 1))
    }

def _generate_human_explanation(product: str, prediction: float, reasoning: Dict, causal: Dict) -> str:
    """Generate human-readable explanation"""
    return f"""
    The prediction for {product} (${prediction:.2f}) is based on:
    - {len(reasoning.get('applicable_rules', []))} market rules
    - {len(causal.get('causal_effects', []))} causal relationships
    - Confidence level: {reasoning.get('confidence', 0.5):.0%}
    
    Key factors: Historical patterns, market dynamics, and external influences
    all suggest this price level is likely given current conditions.
    """

def _generate_optimization_summary(results: Dict[str, Dict]) -> Dict[str, Any]:
    """Generate optimization summary"""
    total_products = len(results)
    reorder_needed = sum(1 for r in results.values() if r['reorder_needed'])
    high_risk = sum(1 for r in results.values() if r['risk_level'] == 'high')
    
    return {
        "total_products": total_products,
        "reorder_needed": reorder_needed,
        "high_risk_products": high_risk,
        "optimization_efficiency": (total_products - high_risk) / total_products if total_products > 0 else 0
    }

def _generate_product_insights(product: str, related_entities: List[tuple], rules: List[str]) -> List[str]:
    """Generate product-specific insights"""
    insights = []
    
    if len(related_entities) > 5:
        insights.append(f"{product} has strong market connections - monitor related products")
    
    if len(rules) > 3:
        insights.append(f"Multiple market rules apply to {product} - high predictability")
    
    high_impact_entities = [e for e, w in related_entities if w > 2.0]
    if high_impact_entities:
        insights.append(f"High impact factors: {', '.join(high_impact_entities[:3])}")
    
    return insights

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)