const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const user = context.clientContext.user;
        if (!user) {
            return { statusCode: 401, body: 'Unauthorized' };
        }

        const data = JSON.parse(event.body);
        const client = new faunadb.Client({ 
            secret: process.env.FAUNADB_SECRET 
        });

        // First delete existing expenses for this user
        await client.query(
            q.Map(
                q.Paginate(
                    q.Match(q.Index('expenses_by_user'), user.sub)
                ),
                q.Lambda('x', q.Delete(q.Var('x')))
            )
        );

        // Then create new document with updated expenses
        const result = await client.query(
            q.Create(q.Collection('user_expenses'), {
                data: {
                    userId: user.sub,
                    expenses: data.expenses,
                    updatedAt: q.Now()
                }
            })
        );

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
