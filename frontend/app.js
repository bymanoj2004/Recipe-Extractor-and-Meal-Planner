document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.tab-content');

    const extractBtn = document.getElementById('extract-btn');
    const urlInput = document.getElementById('recipe-url');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('error-message');
    const recipeDisplay = document.getElementById('recipe-display');

    const modal = document.getElementById('recipe-modal');
    const closeBtn = document.querySelector('.close-btn');
    const modalDisplay = document.getElementById('modal-recipe-display');
    const historyTableBody = document.querySelector('#history-table tbody');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => {
                c.classList.remove('active');
                c.classList.add('hidden');
            });

            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            if (target) {
                target.classList.remove('hidden');
                target.classList.add('active');
            }

            if (tab.dataset.tab === 'history') {
                loadHistory();
            }
        });
    });

    extractBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (!url) {
            errorMsg.textContent = 'Please enter a recipe URL.';
            errorMsg.classList.remove('hidden');
            return;
        }

        recipeDisplay.classList.add('hidden');
        errorMsg.classList.add('hidden');
        loading.classList.remove('hidden');

        try {
            const res = await fetch('/api/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            if (!res.ok) {
                let errMessage = 'Failed to extract recipe.';
                try {
                    const err = await res.json();
                    errMessage = err.detail || err.message || errMessage;
                } catch (_) {}
                throw new Error(errMessage);
            }

            const data = await res.json();
            renderRecipe(data, recipeDisplay);
            recipeDisplay.classList.remove('hidden');
        } catch (err) {
            errorMsg.textContent = err.message || 'Something went wrong.';
            errorMsg.classList.remove('hidden');
        } finally {
            loading.classList.add('hidden');
        }
    });

    async function loadHistory() {
        historyTableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';

        try {
            const res = await fetch('/api/recipes', { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch recipe history.');

            const recipes = await res.json();
            historyTableBody.innerHTML = '';

            if (!Array.isArray(recipes) || recipes.length === 0) {
                historyTableBody.innerHTML = '<tr><td colspan="5">No saved recipes yet.</td></tr>';
                return;
            }

            recipes.forEach(recipe => {
                const tr = document.createElement('tr');
                const createdDate = recipe.created_at ? new Date(recipe.created_at).toLocaleDateString() : '-';
                tr.innerHTML = `
                    <td>${escapeHtml(recipe.title || 'Untitled')}</td>
                    <td>${escapeHtml(recipe.cuisine || 'Unknown')}</td>
                    <td>${escapeHtml(recipe.difficulty || 'Unknown')}</td>
                    <td>${escapeHtml(createdDate)}</td>
                    <td><button class="action-btn" data-id="${recipe.id}">Details</button></td>
                `;
                historyTableBody.appendChild(tr);
            });
        } catch (err) {
            historyTableBody.innerHTML = '<tr><td colspan="5">Failed to load history.</td></tr>';
            console.error('History load error:', err);
        }
    }

    historyTableBody.addEventListener('click', async (e) => {
        const btn = e.target.closest('.action-btn');
        if (!btn) return;
        await showRecipeDetails(btn.dataset.id);
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    async function showRecipeDetails(id) {
        modalDisplay.innerHTML = '<div class="spinner" style="margin:2rem auto"></div>';
        modal.classList.remove('hidden');

        try {
            const res = await fetch(`/api/recipes/${id}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Failed to fetch recipe details.');
            const recipe = await res.json();
            renderRecipe(recipe, modalDisplay);
        } catch (err) {
            modalDisplay.innerHTML = '<p class="error">Failed to load recipe details.</p>';
            console.error('Recipe details error:', err);
        }
    }

    function renderRecipe(recipe, container) {
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        const instructions = Array.isArray(recipe.instructions) ? recipe.instructions : [];
        const substitutions = Array.isArray(recipe.substitutions) ? recipe.substitutions : [];
        const relatedRecipes = Array.isArray(recipe.related_recipes) ? recipe.related_recipes : [];
        const nutrition = recipe.nutrition_estimate && typeof recipe.nutrition_estimate === 'object' ? recipe.nutrition_estimate : {};

        const ingredientsHtml = ingredients.map(ing => {
            if (typeof ing === 'string') return `<li>${escapeHtml(ing)}</li>`;
            const quantity = ing?.quantity ? `${escapeHtml(String(ing.quantity))} ` : '';
            const unit = ing?.unit ? `${escapeHtml(String(ing.unit))} ` : '';
            const item = ing?.item ? escapeHtml(String(ing.item)) : 'Unknown ingredient';
            return `<li>${quantity}${unit}${item}</li>`;
        }).join('');

        const instructionsHtml = instructions.map(inst => `<li>${escapeHtml(String(inst))}</li>`).join('');
        const substitutionsHtml = substitutions.map(sub => `<li>${escapeHtml(String(sub))}</li>`).join('');
        const relatedRecipesHtml = relatedRecipes.map(rel => `<li>${escapeHtml(String(rel))}</li>`).join('');

        let shoppingListHtml = '<p>No shopping list available.</p>';
        const shoppingList = recipe.shopping_list || {};
        if (Array.isArray(shoppingList) && shoppingList.length) {
            shoppingListHtml = `<ul>${shoppingList.map(item => `<li>${escapeHtml(String(item))}</li>`).join('')}</ul>`;
        } else if (shoppingList && typeof shoppingList === 'object' && Object.keys(shoppingList).length) {
            shoppingListHtml = Object.entries(shoppingList).map(([cat, items]) => {
                const text = Array.isArray(items) ? items.map(i => escapeHtml(String(i))).join(', ') : escapeHtml(String(items));
                return `<p><strong>${escapeHtml(cat)}</strong>: ${text}</p>`;
            }).join('');
        }

        container.innerHTML = `
            <div class="recipe-layout">
                <div class="recipe-header">
                    <h2 class="recipe-title">${escapeHtml(recipe.title || 'Untitled Recipe')}</h2>
                    <div class="recipe-meta">
                        <span>🍳 Cuisine: ${escapeHtml(recipe.cuisine || 'Unknown')}</span>
                        <span>⏱ Prep: ${escapeHtml(recipe.prep_time || 'N/A')}</span>
                        <span>🔥 Cook: ${escapeHtml(recipe.cook_time || 'N/A')}</span>
                        <span>🍽 Servings: ${escapeHtml(recipe.servings || 'N/A')}</span>
                        <span>💪 Difficulty: ${escapeHtml(recipe.difficulty || 'Unknown')}</span>
                    </div>
                </div>

                <div class="recipe-main">
                    <div class="recipe-section">
                        <h3>Ingredients</h3>
                        ${ingredientsHtml ? `<ul class="ingredients-list">${ingredientsHtml}</ul>` : '<p>No ingredients available.</p>'}
                    </div>

                    <div class="recipe-section">
                        <h3>Instructions</h3>
                        ${instructionsHtml ? `<ol class="instructions-list">${instructionsHtml}</ol>` : '<p>No instructions available.</p>'}
                    </div>
                </div>

                <div class="recipe-sidebar">
                    <div class="recipe-section glass-card" style="padding: 1rem; margin-bottom: 1rem">
                        <h3>Nutrition Estimate</h3>
                        <div class="nutrition-grid">
                            <div class="nut-item"><strong>${escapeHtml(nutrition.calories || 'N/A')}</strong><span>Calories</span></div>
                            <div class="nut-item"><strong>${escapeHtml(nutrition.protein || 'N/A')}</strong><span>Protein</span></div>
                            <div class="nut-item"><strong>${escapeHtml(nutrition.carbs || 'N/A')}</strong><span>Carbs</span></div>
                            <div class="nut-item"><strong>${escapeHtml(nutrition.fat || 'N/A')}</strong><span>Fat</span></div>
                        </div>
                    </div>

                    <div class="recipe-section">
                        <h3>Substitutions</h3>
                        ${substitutionsHtml ? `<ul class="subs-list">${substitutionsHtml}</ul>` : '<p>No substitutions available.</p>'}
                    </div>

                    <div class="recipe-section">
                        <h3>Shopping List</h3>
                        ${shoppingListHtml}
                    </div>

                    <div class="recipe-section">
                        <h3>Related Recipes</h3>
                        ${relatedRecipesHtml ? `<ul class="related-list">${relatedRecipesHtml}</ul>` : '<p>No related recipes available.</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
});
