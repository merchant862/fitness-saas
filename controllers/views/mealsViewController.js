async function mealsViewController(req, res, next)
{
    try
    {
        const mealsData = {
            currentUser: {
                name: 'Saboor',
                goal: 'Weight Loss',
                level: 'Beginner',
                environment: 'Home'
            },

            summary: {
                activePlan: '4 Week Fat Loss Meal Plan',
                currentWeek: 2,
                mealsFollowed: 18,
                dailyCalories: 1850
            },

            macros: {
                protein: '140g',
                carbs: '160g',
                fats: '55g',
                water: '2.5L'
            },

            todayMeals: {
                breakfast: {
                    title: 'Oats with Banana',
                    calories: '420 kcal',
                    time: '8:00 AM',
                    items: [
                        'Rolled oats',
                        '1 banana',
                        '1 tbsp peanut butter',
                        'Low fat milk'
                    ]
                },
                lunch: {
                    title: 'Grilled Chicken and Rice',
                    calories: '560 kcal',
                    time: '1:00 PM',
                    items: [
                        '150g grilled chicken',
                        '1 cup rice',
                        'Mixed vegetables'
                    ]
                },
                dinner: {
                    title: 'Egg Omelette with Salad',
                    calories: '430 kcal',
                    time: '8:00 PM',
                    items: [
                        '3 eggs',
                        'Tomato and cucumber salad',
                        '1 slice whole wheat bread'
                    ]
                },
                snack: {
                    title: 'Greek Yogurt',
                    calories: '180 kcal',
                    time: '5:00 PM',
                    items: [
                        '1 bowl greek yogurt',
                        'Handful of berries'
                    ]
                }
            },

            shoppingList: [
                'Chicken breast',
                'Eggs',
                'Rolled oats',
                'Rice',
                'Greek yogurt',
                'Bananas',
                'Peanut butter',
                'Tomatoes',
                'Cucumbers',
                'Mixed vegetables'
            ],

            weeklyPlan: [
                { day: 'Monday', focus: 'High Protein', status: 'Completed' },
                { day: 'Tuesday', focus: 'Balanced Meals', status: 'Completed' },
                { day: 'Wednesday', focus: 'Lower Carb', status: 'Completed' },
                { day: 'Thursday', focus: 'Fat Loss Meals', status: 'Today' },
                { day: 'Friday', focus: 'Balanced Meals', status: 'Upcoming' },
                { day: 'Saturday', focus: 'Higher Energy Meals', status: 'Upcoming' },
                { day: 'Sunday', focus: 'Flexible Eating', status: 'Upcoming' }
            ],

            tips: [
                'Keep protein high in every major meal.',
                'Drink water before meals to stay on track.',
                'Prep lunch in advance to avoid skipping meals.'
            ]
        };

        return res.status(200).render('../views/meals.ejs', { mealsData });
    }
    catch (error)
    {
        next(error);
    }
}

module.exports = mealsViewController;