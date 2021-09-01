module Fetcher
  def self.included(base) # rubocop:disable Metrics/MethodLength, Metrics/AbcSize
    base.class_eval do
      it = {}
      param = lambda do |c|
        if c.field.nil?
          { primary_key => c.value.send(primary_key) }
        else
          { c.field => c.value }
        end
      end

      it['Eq'] = it['In'] = ->(q, c) { q.where param[c] }
      it['Neq'] = ->(q, c) { q.where.not param[c] }
      it.default_proc = proc { |k| raise "Unsupported constraint kind: #{k}" }
      it.freeze

      instance_variable_set :@constrain, it

      def self.build_query(cons)
        cons.reduce(all) { |q, c| @constrain[c.kind][q, c] }
      end

      def self.exec_query(query)
        query.distinct.to_a
      end

      def self.combine_query(one, two)
        one.or(two)
      end
    end
  end
end
